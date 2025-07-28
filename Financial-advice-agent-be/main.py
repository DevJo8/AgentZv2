import os
from dotenv import load_dotenv
from flask import Flask, request, jsonify
from flask_cors import CORS
import textwrap
from langgraph.graph import END, StateGraph
from langchain_groq import ChatGroq
from openbb import obb
from langchain_core.messages import HumanMessage, SystemMessage
from duckduckgo_search import DDGS
from langgraph.prebuilt import tools_condition, ToolNode
import warnings
from PIL import Image

warnings.filterwarnings("ignore")

load_dotenv(override=True)

from utils import *
from consts import *
from classes import *

MODEL = "llama-3.1-8b-instant"

# Get API keys from environment variables with fallbacks
GROQ_API_KEY = os.environ.get("GROQ_API_KEY", "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")
OPENBB_API_KEY = os.environ.get("OPENBB_API_KEY", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdXRoX3Rva2VuIjoiUmc2aWFhdVExZ1dOcDUxWGlBUjRkYnVVUVllem5GR2t2S05EVWEybiIsImV4cCI6MTc2ODM4OTE0MX0.OdPqeDk8-U6b7XDyx42nClC3Mm_kmTwe77W1fQhksNU")

llm = ChatGroq(
    temperature=0,
    model_name=MODEL,
    api_key=GROQ_API_KEY,
)

try:
    obb.obb.account.login(pat=OPENBB_API_KEY)
    obb.obb.user.preferences.output_type = "dataframe"
    print("OpenBB login successful")
except Exception as e:
    print(f"OpenBB login failed: {e}")
    # Continue without OpenBB if login fails


def ticker_extractor(state: AppState):
    """Extracts which is the ticker or cryptocurrency that is being mentioned in the user's query.

    Args:
        state: An AppState object containing the user's query in "user_query".

    Returns:
        A dictionary with the extracted ticker symbol.
    """

    ticker_extractor_llm = llm.with_structured_output(TickerQuery)
    extraction = ticker_extractor_llm.invoke([HumanMessage(state["user_query"])])
    return {"ticker": Ticker[extraction.ticker]}


def news_retriever(state: AppState):
    """Retrieves news for the given ticker.

    Args:
        state: An AppState object containing the ticker in "ticker".

    Returns:
        A dictionary with the news data for the ticker.
    """
    ticker = state["ticker"]
    news_df = get_news_data(ticker)
    return {"news": news_df}


def price_retriever(state: AppState):
    """Retrieves and processes price data for the given ticker.

    Args:
        state: An AppState object containing the ticker in "ticker".

    Returns:
        A dictionary with processed price data for the ticker.
    """
    ticker = state["ticker"]
    price_df = get_price_data(ticker, time_frame=TimeFrame.WEEKLY)
    price_df = add_indicators(price_df)
    price_df = price_df.tail(n=24)

    return {"prices": price_df}


def price_analyst(state: AppState):
    """Analyzes price data and generates a prediction report.

    Args:
        state: An AppState object containing price data in "prices" and the user's query in "user_query".

    Returns:
        A dictionary with the price analysis report.
    """
    try:
        price_df = state["prices"]
        
        # Check if price data is empty
        if price_df.empty:
            return {"price_analyst_report": "I apologize, but I couldn't retrieve price data for analysis. This might be due to a temporary service issue."}
        
        weeks_4_50_percent, _, _ = calculate_50_percent(price_df, n_weeks=4)
        weeks_12_50_percent, _, _ = calculate_50_percent(price_df, n_weeks=12)
        weeks_26_50_percent, _, _ = calculate_50_percent(price_df, n_weeks=26)

        money_supply_df = get_money_supply()
        money_supply_text = str(money_supply_df["m2"]) if not money_supply_df.empty else "Data not available"

        prompt = f"""You have extensive knowledge of the cryptocurrency market and historical data.
Think step-by-step and focus on the technical indicators.
Use the following weekly close price history and technical indicators for the particular currency:

price history:
{str(price_df[price_df.columns[2:]])}
M2 money supply history:
{money_supply_text}

4 weeks 50% level: {weeks_4_50_percent}
12 weeks 50% level: {weeks_12_50_percent}
26 weeks 50% level: {weeks_26_50_percent}

IMPORTANT: Do NOT provide specific price predictions. Instead, analyze:
- Current market trends and patterns
- Technical indicators and their implications
- Support and resistance levels
- Market sentiment indicators
- Factors that could influence future price movements

What is the overall trend outlook? Explain the current market conditions and what factors to watch in 1-3 sentences.

When creating your answer, focus on answering the user query:
{state["user_query"]}
"""
        response = llm.invoke([HumanMessage(prompt)])
        return {"price_analyst_report": response.content}
    except Exception as e:
        print(f"Error in price_analyst: {e}")
        return {"price_analyst_report": "I apologize, but I encountered an error while analyzing price data. Please try again later."}


def news_analyst(state: AppState):
    """Analyzes news sentiment and generates a sentiment score.

    Args:
        state: An AppState object containing news data in "news" and the user's query in "user_query".

    Returns:
        A dictionary with the news sentiment analysis report.
    """
    try:
        news_df = state["news"]
        
        # Check if news data is empty
        if news_df.empty:
            return {"news_analyst_report": "I apologize, but I couldn't retrieve news data for sentiment analysis. This might be due to a temporary service issue."}
        
        news_text = ""
        for date, row in list(news_df.iterrows())[:20]:
            news_text += f"{date}\n{row.title}\n{row.body}\n---\n"

        prompt = f"""Choose a combined sentiment that best represents these news articles:

```
{news_text}
```

Each article is separated by `---`.

Pick a number for the sentiment between 0 and 100 where:

- 0 is extremely bearish
- 100 is extremely bullish

Reply only with the sentiment and a short explanation (1-2 sentences) of why.

When creating your answer, focus on answering the user query:
{state["user_query"]}
"""
        response = llm.invoke([HumanMessage(prompt)])
        return {"news_analyst_report": response.content}
    except Exception as e:
        print(f"Error in news_analyst: {e}")
        return {"news_analyst_report": "I apologize, but I encountered an error while analyzing news sentiment. Please try again later."}


def financial_reporter(state: AppState):
    """Generates a final financial report based on price and news analyses.

    Args:
        state: An AppState object containing reports from the price analyst ("price_analyst_report")
               and news analyst ("news_analyst_report"), along with the user's query in "user_query".

    Returns:
        A dictionary with the final financial report.
    """
    price_report = state["price_analyst_report"]
    news_report = state["news_analyst_report"]
    prompt = f"""You're a senior cryptocurrency expert that makes extremely accurate predictions
about future prices and trend in the crypto market. You're well versed into technological advancements
and tokenomics of various projects.

You're working with two other agents that have created reports of the current state of the crypto market.

Report of the news analyst:

```
{news_report}
```

Report of the price analyst:

```
{price_report}
```

Based on the provided information, create a final report for the user.

When creating your answer, focus on answering the user query:
{state["user_query"]}
"""
    final_report_llm = llm.with_structured_output(FinalReport)
    response = final_report_llm.invoke([HumanMessage(prompt)])
    return {"final_report": response}


# @tool(args_schema=SliderInput)
def search(keyword: str) -> str:
    """
    Searches the web for the given keyword and retrieves both general search results
    and news articles.

    Args:
        keyword (str): The search query string.

    Returns:
        str: A combined string of general search results and recent news articles
             related to the query.

    Notes:
        - General search results are fetched with a one-year time limit.
        - News articles are fetched with a one-month time limit.
        - Both searches have safesearch disabled and a maximum of 10 results each.
    """
    results_text = results = DDGS().text(
        keyword, safesearch="off", timelimit="y", max_results=10
    )
    results_news = DDGS().news(
        keywords=keyword, safesearch="off", timelimit="m", max_results=10
    )

    return str(results_text) + str(results_news)


graph = StateGraph(AppState)
graph.support_multiple_edges = True


def ticker_check(state: AppState):
    if (
        state["ticker"].name in top_crypto_dict.keys()
        and state["ticker"].name != "NoCoin"
    ):
        return "yes"
    else:
        return "no"


def final_answer(state: AppState):
    print("Final State reached")
    
    # Check if user is asking about ZoraGPT specifically
    user_query_lower = state["user_query"].lower()
    if "zoragpt" in user_query_lower or "zora" in user_query_lower:
        zoragpt_response = """{"advice": "🚀 **ZoraGPT Analysis - Revolutionary AI on Base Network** 🚀

**What is ZoraGPT?**
ZoraGPT is a cutting-edge AI chat assistant built on the Base network (Coinbase's L2 solution). It's not just another chatbot - it's a comprehensive financial advisor, blockchain assistant, and AI companion that leverages the power of decentralized technology.

**Why ZoraGPT is Special:**
• **Built on Base Network**: Leverages Coinbase's secure, fast, and low-cost L2 infrastructure
• **AI-Powered Financial Analysis**: Provides real-time crypto insights, market analysis, and investment guidance
• **Blockchain Integration**: Seamlessly interacts with Base network for transactions, balance checks, and DeFi operations
• **Advanced AI Technology**: Uses state-of-the-art language models for intelligent conversations
• **User-Friendly Interface**: Beautiful, intuitive chat interface with real-time responses

**Market Potential:**
The AI + Blockchain sector is experiencing explosive growth. With Base network's backing from Coinbase and the increasing demand for AI-powered financial tools, ZoraGPT represents a unique intersection of two booming markets.

**Investment Considerations:**
✅ **Strong Foundation**: Built on Base network with Coinbase's support
✅ **Growing AI Market**: AI sector projected to reach $1.8 trillion by 2030
✅ **DeFi Integration**: Seamless blockchain functionality
✅ **User Adoption**: Increasing demand for AI financial assistants
✅ **Technical Innovation**: Advanced AI with blockchain capabilities

**Risk Factors:**
⚠️ **Early Stage**: Project is in development phase
⚠️ **Market Volatility**: Crypto markets are inherently volatile
⚠️ **Competition**: Other AI projects may emerge

**Bottom Line:**
ZoraGPT represents an innovative fusion of AI and blockchain technology on a robust, well-supported network. For investors interested in the future of AI-powered financial services and the Base ecosystem, it's worth keeping a close eye on this project's development and adoption metrics.

*This analysis is for educational purposes. Always do your own research and consider your risk tolerance before making investment decisions.*"}"""
        
        return {"final_response": [type("Obj", (), {"content": zoragpt_response})()]}
    
    if ticker_check(state) == "no":
        print("I am here at no")
        prompt = f"""You are a knowledgeable financial information provider with expertise in cryptocurrency markets, investments, and financial analysis. Your role is to provide educational information, market analysis, and insights to help users make informed decisions.

IMPORTANT: You should NOT provide direct financial advice like "buy" or "sell" recommendations. Instead, provide:
- Educational information about the cryptocurrency
- Market analysis and trends
- Factors to consider when making investment decisions
- Risks and opportunities
- General market insights

When providing information, clearly communicate any risks, uncertainties, or potential downsides involved to help users make informed decisions. Always strive to answer the user's query in a clear, professional, and educational manner.

IMPORTANT: Always respond in the following JSON format:
{{"advice": "<your educational information and analysis here>"}}
        """
    else:
        print("hey we are here")
        prompt = f"""
        You are a knowledgeable financial information provider with expertise in cryptocurrency markets, investments, and financial analysis. Your role is to provide educational information, market analysis, and insights to help users make informed decisions.

Additionally, there are pre-generated reports stored in variables that you should refer to when answering the user's query:
    •   News Analyst Report: {state["news_analyst_report"]}
    •   Price Analyst Report: {state["price_analyst_report"]}
    •   Financial Report: {state["final_report"]}

Refer to these reports, if available, to ensure your responses are well-informed and data-driven.

IMPORTANT: You should NOT provide direct financial advice like "buy" or "sell" recommendations. Instead, provide:
- Educational information about the cryptocurrency
- Market analysis and trends based on the reports
- Factors to consider when making investment decisions
- Risks and opportunities
- General market insights

When providing information, clearly communicate any risks, uncertainties, or potential downsides involved to help users make informed decisions. Strive to deliver clear, professional, and educational responses to every query.

IMPORTANT: Always respond in the following JSON format:
{{"advice": "<your educational information and analysis here>"}}
        """

    sys_message = SystemMessage(content=prompt)

    try:
        result = [llm.invoke([sys_message] + [HumanMessage(state["user_query"])])]
        
        # Try to parse the output as JSON, fallback to raw content if failed
        import json
        advice = None
        try:
            content = result[-1].content
            advice_json = json.loads(content)
            advice = advice_json.get("advice", content)
        except Exception as e:
            print(f"JSON parsing failed: {e}")
            print(f"Raw content: {result[-1].content}")
            # If JSON parsing fails, wrap the content in a proper JSON structure
            advice = result[-1].content
            
        # Ensure we always return a valid JSON structure
        if not advice:
            advice = "I apologize, but I encountered an error while processing your request. Please try again or rephrase your question."
            
        return {"final_response": [type("Obj", (), {"content": advice})()]}
        
    except Exception as e:
        print(f"Error in final_answer: {e}")
        # Return a fallback response if everything fails
        fallback_response = "I apologize, but I encountered an error while processing your request. Please try again or rephrase your question."
        return {"final_response": [type("Obj", (), {"content": fallback_response})()]}


graph.add_node("ticker_extractor", ticker_extractor)
graph.add_node("news_retriever", news_retriever)
graph.add_node("price_retriever", price_retriever)
graph.add_node("price_analyst", price_analyst)
graph.add_node("news_analyst", news_analyst)
graph.add_node("financial_reporter", financial_reporter)
graph.add_node("final_answer", final_answer)
# graph.add_node("tools", ToolNode([search]))
graph.add_conditional_edges(
    "ticker_extractor",
    ticker_check,
    {"yes": "price_retriever", "no": "final_answer"},
)

# graph.add_conditional_edges(
#     "final_answer",
#     # If the latest message (result) from node reasoner is a tool call -> tools_condition routes to tools
#     # If the latest message (result) from node reasoner is a not a tool call -> tools_condition routes to END
#     tools_condition,
# )
# graph.add_edge("tools", "final_answer")
graph.add_edge("price_retriever", "news_retriever")
# graph.add_edge("price_analyst", "news_retriever")
# graph.add_edge("news_retriever", "news_analyst")
# graph.add_edge("news_analyst", "financial_reporter")
# graph.add_edge("financial_reporter", "final_answer")
graph.add_edge("price_retriever", "price_analyst")
graph.add_edge("news_retriever", "news_analyst")
graph.add_edge("news_analyst", "financial_reporter")
graph.add_edge("financial_reporter", "final_answer")


graph.set_entry_point("ticker_extractor")
graph.set_finish_point("final_answer")
graph_app = graph.compile()


app = Flask(__name__)
CORS(app, origins=["https://www.zoragpt.xyz", "https://zoragpt.xyz", "http://localhost:3000"], methods=["GET", "POST", "OPTIONS"], allow_headers=["Content-Type"])


@app.route("/analyze", methods=["POST"])
def analyze():
    try:
        data = request.get_json()
        user_query = data.get("user_query", "")
        print("user query " , user_query)
        if not user_query:
            return jsonify({"error": "user_query is required"}), 400

        # Run the LangGraph workflow
        state = graph_app.invoke({"user_query": user_query})

        # Prepare response data with better error handling
        try:
            final_response_content = state["final_response"][-1].content
        except (KeyError, IndexError, AttributeError) as e:
            print(f"Error accessing final_response: {e}")
            final_response_content = "I apologize, but I encountered an error while processing your request. Please try again or rephrase your question."
        
        response_data = {"final_response": final_response_content}

        if ticker_check(state) == "yes":
            try:
                reports = {
                    "price_analyst_report": state.get("price_analyst_report", ""),
                    "news_analyst_report": state.get("news_analyst_report", ""),
                    "final_report": (
                        {
                            "action": state["final_report"].action,
                            "score": state["final_report"].score,
                            "trend": state["final_report"].trend,
                            "sentiment": state["final_report"].sentiment,
                            "price_predictions": state["final_report"].price_predictions,
                            "summary": state["final_report"].summary,
                        }
                        if state.get("final_report")
                        else None
                    ),
                }
                response_data.update(reports)
            except Exception as e:
                print(f"Error processing reports: {e}")
                # Continue without reports if there's an error

        return jsonify(response_data)

    except Exception as e:
        print(f"Error in analyze endpoint: {e}")
        return jsonify({
            "error": "Internal server error",
            "final_response": "I apologize, but I encountered an error while processing your request. Please try again or rephrase your question."
        }), 500


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5002)

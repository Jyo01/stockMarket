import { useEffect, useState } from "react";
import "./App.css";

export interface Investment {
  id: number;
  investment: string;
  amount: number;
  quantity: number;
  netamount: number;
  currentPrice: number;
}

function App() {
  const [data, setData] = useState<Investment[]>([]);
  const [selectedInvestment, setSelectedInvestment] = useState<Investment | null>(null);

  const tickerMap: Record<string, string> = {
    Apple: "AAPL",
    Google: "GOOGL",
    Tesla: "TSLA",
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("http://localhost:3000/investments");
        const localData: Omit<Investment, "currentPrice">[] = await response.json();

        const updatedData = await Promise.all(
          localData.map(async (item) => {
            const ticker = tickerMap[item.investment];
            if (!ticker) return { ...item, currentPrice: 0 };

            try {
              const url = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}`;
              const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
              const res = await fetch(proxyUrl);
              const textData = await res.json();

              const yahooData = JSON.parse(textData.contents);

              const price =
                yahooData?.chart?.result?.[0]?.meta?.regularMarketPrice ?? 0;

              return { ...item, currentPrice: price };
            } catch (error) {
              console.error(`Error fetching price for ${item.investment}:`, error);
              return { ...item, currentPrice: 0 };
            }
          })
        );

        setData(updatedData);
      } catch (error) {
        console.error("Error fetching local investments:", error);
      }
    };

    fetchData();
  }, []);

  const handleDelete = (id: number) => {
    setData((prev) => prev.filter((item) => item.id !== id));
    setSelectedInvestment((prev) => (prev?.id === id ? null : prev));
  };

  const handleSelect = (item: Investment) => {
    setSelectedInvestment(item);
  };

  return (
    <>
      <div>
        <h2>Dashboard</h2>
      </div>
      <div className="container">
        <table>
          <thead>
            <tr>
              <th>Investment</th>
              <th>Amount</th>
              <th>Quantity</th>
              <th>Net Amount</th>
              <th>Current Price</th>
              <th>Profit/Loss</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item) => {
              const netAmount = item.amount * item.quantity;
              const currentValue = item.currentPrice * item.quantity;
              const profitLoss = currentValue - netAmount;

              return (
                <tr key={item.id}>
                  <td
                    onClick={() => handleSelect(item)}
                    style={{ cursor: "pointer" }}
                  >
                    {item.investment}
                  </td>

                  <td>{item.amount}</td>
                  <td>{item.quantity}</td>
                  <td>${netAmount}</td>

                  <td>
                    {item.currentPrice > 0
                      ? `$${item.currentPrice.toFixed(2)}`
                      : "Loading"}
                  </td>

                  <td
                    style={{
                      color: profitLoss > 0 ? "green" : profitLoss < 0 ? "red" : "black",
                      fontWeight: "bold",
                    }}>
                    {item.currentPrice > 0
                      ? `${profitLoss > 0 ? "+" : ""}${profitLoss.toFixed(2)}`
                      : "--"}
                  </td>

                  <td>
                    <button onClick={() => handleDelete(item.id)}>
                      Delete
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>

        </table>

        {selectedInvestment && (
          <div className="details">
            <h3>Investment Details</h3>
            <p><strong>Investment:</strong> {selectedInvestment.investment}</p>
            <p><strong>Amount:</strong> {selectedInvestment.amount}</p>
            <p><strong>Quantity:</strong> {selectedInvestment.quantity}</p>
            <p>
              <strong>Current Price:</strong>{" "}
              {selectedInvestment.currentPrice > 0
                ? `$${selectedInvestment.currentPrice.toFixed(2)}`
                : "Not available"}
            </p>
            <p>
              <strong>Current Value:</strong>{" "}
              {selectedInvestment.currentPrice > 0
                ? `$${(selectedInvestment.quantity * selectedInvestment.currentPrice).toFixed(2)}`
                : "N/A"}
            </p>
          </div>
        )}
      </div>
    </>
  );
}

export default App;

import { useEffect, useMemo, useState } from "react";
import "./App.css";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "";
const MEALS = ["All", "Breakfast", "Lunch", "Dinner"];

function App() {
  const [city, setCity] = useState("Sangli");
  const [cities, setCities] = useState([]);

  // Load city list from DB on mount
  useEffect(() => {
    fetch(`${API_BASE}/api/cities`)
      .then((r) => r.json())
      .then((data) => setCities(data.cities || []))
      .catch(() =>
        setCities(["Sangli", "Kolhapur", "Pune", "Mumbai", "Bangalore"]),
      );
  }, []);
  const [mealType, setMealType] = useState("All");
  const [maxPrice, setMaxPrice] = useState(2000);
  const [minRating, setMinRating] = useState(0);

  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(
    "Click Explore to find top spots in Sangli!",
  );

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedback, setFeedback] = useState({ email: "", message: "" });
  const [feedbackStatus, setFeedbackStatus] = useState("");

  const resultTitle = useMemo(() => {
    if (!city) return "Premium Selections";
    return mealType === "All"
      ? `Handpicked in ${city}`
      : `${mealType} in ${city}`;
  }, [city, mealType]);

  const fetchRestaurants = async () => {
    if (!city) {
      setMessage("Please select a city first.");
      setRestaurants([]);
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const params = new URLSearchParams({
        city,
        mealType,
        maxPrice: String(maxPrice),
        minRating: String(minRating),
      });

      const response = await fetch(
        `${API_BASE}/api/restaurants?${params.toString()}`,
      );
      if (!response.ok) {
        throw new Error("Failed to fetch restaurants.");
      }

      const data = await response.json();
      setRestaurants(data.items || []);
      if (!data.items?.length) {
        setMessage("No matches found.");
      }
    } catch {
      setRestaurants([]);
      setMessage("Could not load data. Please make sure backend is running.");
    } finally {
      setLoading(false);
    }
  };

  const submitFeedback = async (event) => {
    event.preventDefault();
    setFeedbackStatus("Sending...");

    try {
      const response = await fetch(`${API_BASE}/api/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(feedback),
      });

      if (!response.ok) {
        throw new Error("Could not submit feedback");
      }

      setFeedback({ email: "", message: "" });
      setFeedbackStatus("Thank you! Feedback received.");
      setTimeout(() => {
        setShowFeedback(false);
        setFeedbackStatus("");
      }, 1200);
    } catch {
      setFeedbackStatus("Something went wrong while submitting.");
    }
  };

  const onMealChange = (nextMeal) => {
    setMealType(nextMeal);
    if (city) {
      const params = new URLSearchParams({
        city,
        mealType: nextMeal,
        maxPrice: String(maxPrice),
        minRating: String(minRating),
      });
      setLoading(true);
      fetch(`${API_BASE}/api/restaurants?${params.toString()}`)
        .then((response) => response.json())
        .then((data) => {
          setRestaurants(data.items || []);
          setMessage(data.items?.length ? "" : "No matches found.");
        })
        .catch(() => {
          setRestaurants([]);
          setMessage(
            "Could not load data. Please make sure backend is running.",
          );
        })
        .finally(() => setLoading(false));
    }
  };

  return (
    <div className="app-shell">
      <nav className="top-nav">
        <div className="container nav-inner">
          <h1 className="brand">CITYWISE</h1>
          <button
            className="feedback-btn"
            onClick={() => setShowFeedback(true)}
          >
            Feedback
          </button>
        </div>
      </nav>

      <header className="hero">
        <div className="container hero-content">
          <h2>Explore Local Flavors</h2>
          <p>Instant restaurant discovery for premium travelers.</p>
        </div>
      </header>

      <main className="container main-content">
        <section className="search-card">
          <div className="field-grid">
            <div>
              <label>Destination</label>
              <select
                value={city}
                onChange={(event) => setCity(event.target.value)}
              >
                <option value="">Select City</option>
                {cities.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label>Meal Type</label>
              <div className="meal-row">
                {MEALS.map((item) => (
                  <button
                    key={item}
                    type="button"
                    className={
                      mealType === item ? "meal-btn active" : "meal-btn"
                    }
                    onClick={() => onMealChange(item)}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>

            <div className="explore-cell">
              <button
                type="button"
                className="explore-btn"
                onClick={fetchRestaurants}
              >
                {loading ? "Loading..." : "Explore Now"}
              </button>
            </div>
          </div>

          <button
            type="button"
            className="advanced-toggle"
            onClick={() => setShowAdvanced((prev) => !prev)}
          >
            Advanced Filters
          </button>

          {showAdvanced && (
            <div className="advanced-panel">
              <div className="range-row">
                <label>Price Range (PP): up to ₹{maxPrice}</label>
                <input
                  type="range"
                  min="100"
                  max="2500"
                  step="50"
                  value={maxPrice}
                  onChange={(event) => setMaxPrice(Number(event.target.value))}
                />
              </div>

              <div className="rating-row">
                <label>Minimum Rating</label>
                <div>
                  {[0, 4, 4.5].map((rating) => (
                    <button
                      key={rating}
                      type="button"
                      className={
                        minRating === rating
                          ? "rating-btn active"
                          : "rating-btn"
                      }
                      onClick={() => setMinRating(rating)}
                    >
                      {rating === 0 ? "Any" : `${rating} ★`}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="button"
                className="apply-btn"
                onClick={fetchRestaurants}
              >
                Apply Filters
              </button>
            </div>
          )}
        </section>

        <section>
          <h3 className="result-title">{resultTitle}</h3>
          {message && !loading && <div className="status-msg">{message}</div>}

          <div className="card-grid">
            {restaurants.map((restaurant) => {
              const query = encodeURIComponent(
                `${restaurant.name}, ${restaurant.addr}, ${restaurant.city}`,
              );
              const mapLink = `https://www.google.com/maps/search/?api=1&query=${query}`;

              return (
                <article
                  className="restaurant-card"
                  key={restaurant._id || restaurant.id}
                >
                  <img
                    src={
                      restaurant.img ||
                      "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=400"
                    }
                    alt={restaurant.name}
                    loading="lazy"
                    onError={(event) => {
                      event.currentTarget.onerror = null; // prevent infinite loop
                      event.currentTarget.src =
                        "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=400";
                    }}
                  />
                  <div className="card-body">
                    <div className="card-head">
                      <h4>{restaurant.name}</h4>
                      <span>{restaurant.rating} ★</span>
                    </div>
                    <p>₹{restaurant.price_per_person} pp</p>
                    <p className="address">{restaurant.addr}</p>
                    <a href={mapLink} target="_blank" rel="noreferrer">
                      View on Map
                    </a>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      </main>

      {showFeedback && (
        <div className="modal-overlay" onClick={() => setShowFeedback(false)}>
          <div
            className="modal-card"
            onClick={(event) => event.stopPropagation()}
          >
            <h3>Share Your Story</h3>
            <p>Your thoughts help us improve the explorer journey.</p>
            <form onSubmit={submitFeedback}>
              <input
                type="email"
                placeholder="Email Address"
                required
                value={feedback.email}
                onChange={(event) =>
                  setFeedback((prev) => ({
                    ...prev,
                    email: event.target.value,
                  }))
                }
              />
              <textarea
                rows="4"
                placeholder="Tell us about your experience..."
                required
                value={feedback.message}
                onChange={(event) =>
                  setFeedback((prev) => ({
                    ...prev,
                    message: event.target.value,
                  }))
                }
              />
              <button type="submit">Submit Feedback</button>
              <button
                type="button"
                className="ghost"
                onClick={() => setShowFeedback(false)}
              >
                Close
              </button>
              {feedbackStatus && (
                <p className="feedback-status">{feedbackStatus}</p>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;

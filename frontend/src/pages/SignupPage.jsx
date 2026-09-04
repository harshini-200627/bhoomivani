import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

function SignupPage() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [selectedCrops, setSelectedCrops] = useState([]);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const crops = [
    "Rice",
    "Cotton",
    "Chilli",
    "Tomato",
    "Groundnut",
    "Maize",
    "Sugarcane",
    "Other",
  ];

  const toggleCrop = (crop) => {
    if (selectedCrops.includes(crop)) {
      setSelectedCrops(
        selectedCrops.filter((item) => item !== crop)
      );
    } else {
      setSelectedCrops([...selectedCrops, crop]);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();

    setError("");

    if (!name || !mobile || !password || !confirmPassword) {
      setError("Please fill all required fields.");
      return;
    }

    if (mobile.length !== 10) {
      setError("Please enter a valid 10-digit mobile number.");
      return;
    }

    if (password.length < 8) {
      setError("Password must contain at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        "http://localhost:5000/api/auth/signup",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: name,
            mobile: mobile,
            password: password,
            location: "",
            crops: selectedCrops,
            preferredLanguage: "te",
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(
          data.message || "Registration failed."
        );
        return;
      }

      alert(
        "Registration successful! Please login."
      );

      // Signup → Login
      navigate("/login");

    } catch (error) {
      console.error("Signup Error:", error);

      setError(
        "Unable to connect to the server. Please check whether your backend is running."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`

        * {
          box-sizing: border-box;
        }

        body {
          margin: 0;
          font-family: Arial, Helvetica, sans-serif;
        }

        .signup-page {
          min-height: 100vh;
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 30px 20px;
          background: #ffffff;
          position: relative;
          overflow: hidden;
        }

        .signup-page::before {
          content: "";
          position: absolute;
          width: 380px;
          height: 380px;
          border-radius: 50%;
          background: rgba(69, 232, 154, 0.08);
          filter: blur(100px);
          top: -180px;
          left: -120px;
        }

        .signup-page::after {
          content: "";
          position: absolute;
          width: 380px;
          height: 380px;
          border-radius: 50%;
          background: rgba(23, 111, 103, 0.08);
          filter: blur(100px);
          right: -150px;
          bottom: -180px;
        }

        .signup-card {
          width: 100%;
          max-width: 520px;
          padding: 38px 42px;
          border-radius: 24px;
          position: relative;
          z-index: 2;

          background:
            radial-gradient(
              circle at 85% 10%,
              rgba(69, 232, 154, 0.20),
              transparent 35%
            ),
            linear-gradient(
              145deg,
              #292535 0%,
              #17392f 45%,
              #0c4331 72%,
              #176f67 100%
            );

          border: 1px solid rgba(69, 232, 154, 0.28);

          box-shadow:
            0 25px 70px rgba(12, 67, 49, 0.22),
            0 0 35px rgba(69, 232, 154, 0.08);
        }

        .brand {
          text-align: center;
          margin-bottom: 25px;
        }

        .brand-icon {
          width: 55px;
          height: 55px;
          margin: 0 auto 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 16px;
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(69, 232, 154, 0.25);
          font-size: 27px;
        }

        .brand-name {
          margin: 0;
          color: #ffffff;
          font-size: 27px;
          font-weight: 700;
        }

        .brand-name span {
          color: #45e89a;
        }

        .brand-native {
          margin-top: 4px;
          color: #f5d35c;
          font-size: 13px;
        }

        .tagline {
          margin-top: 7px;
          color: #c7d5ce;
          font-size: 10px;
        }

        .heading {
          margin-bottom: 22px;
        }

        .heading h2 {
          margin: 0 0 7px;
          color: #ffffff;
          font-size: 25px;
        }

        .heading p {
          margin: 0;
          color: #b7c9c0;
          font-size: 12px;
          line-height: 1.6;
        }

        .form-group {
          margin-bottom: 15px;
        }

        .form-group label {
          display: block;
          margin-bottom: 7px;
          color: #ffffff;
          font-size: 11px;
          font-weight: 600;
        }

        .input-box {
          height: 46px;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 0 13px;
          background: rgba(255, 255, 255, 0.97);
          border: 1px solid rgba(255, 255, 255, 0.5);
          border-radius: 10px;
        }

        .input-box:focus-within {
          border-color: #45e89a;
          box-shadow:
            0 0 0 3px rgba(69, 232, 154, 0.16);
        }

        .input-icon {
          width: 20px;
          text-align: center;
          color: #d6a900;
        }

        .input-box input {
          flex: 1;
          min-width: 0;
          border: none;
          outline: none;
          background: transparent;
          color: #17392f;
          font-size: 12px;
        }

        .input-box input::placeholder {
          color: #718078;
        }

        .eye-btn {
          border: none;
          background: transparent;
          color: #64756d;
          cursor: pointer;
        }

        .crop-box {
          padding: 13px;
          background: rgba(255, 255, 255, 0.07);
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 10px;
        }

        .crop-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 11px;
        }

        .crop-option {
          display: flex;
          align-items: center;
          gap: 5px;
          color: #e0e9e4;
          font-size: 10px;
          cursor: pointer;
        }

        .crop-option input {
          width: 13px;
          height: 13px;
          accent-color: #45e89a;
        }

        .selected-crops {
          margin-top: 10px;
          color: #45e89a;
          font-size: 9px;
        }

        .error-message {
          margin: 5px 0 15px;
          padding: 10px;
          border-radius: 8px;
          background: rgba(255, 80, 80, 0.10);
          border: 1px solid rgba(255, 100, 100, 0.25);
          color: #ffb3b3;
          font-size: 10px;
          text-align: center;
        }

        .register-btn {
          width: 100%;
          height: 48px;
          margin-top: 5px;
          border: none;
          border-radius: 10px;
          background: #45e89a;
          color: #10251c;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          transition: 0.25s;
        }

        .register-btn:hover {
          background: #5af0a8;
          transform: translateY(-2px);
        }

        .register-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .login-link {
          text-align: center;
          margin-top: 20px;
          color: #c2d0ca;
          font-size: 10px;
        }

        .login-link button {
          margin-left: 5px;
          border: none;
          background: transparent;
          color: #45e89a;
          font-size: 10px;
          font-weight: 600;
          cursor: pointer;
        }

        .footer {
          text-align: center;
          margin-top: 18px;
          color: #8fa39a;
          font-size: 9px;
        }

        @media (max-width: 600px) {
          .signup-card {
            padding: 30px 23px;
          }

          .crop-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

      `}</style>

      <div className="signup-page">

        <div className="signup-card">

          <div className="brand">

            <div className="brand-icon">
              🌱
            </div>

            <h1 className="brand-name">
              Bhūmi<span>Vāṇī</span>
            </h1>

            <div className="brand-native">
              भूमिवाणी
            </div>

            <div className="tagline">
              When the Land Speaks, We Listen.
            </div>

          </div>

          <div className="heading">

            <h2>Join BhūmiVāṇī</h2>

            <p>
              Start receiving simple, actionable
              agricultural guidance.
            </p>

          </div>

          <form onSubmit={handleSignup}>

            <div className="form-group">

              <label>Full Name</label>

              <div className="input-box">

                <span className="input-icon">
                  👤
                </span>

                <input
                  type="text"
                  placeholder="e.g., Ramesh Kumar"
                  value={name}
                  onChange={(e) =>
                    setName(e.target.value)
                  }
                />

              </div>

            </div>

            <div className="form-group">

              <label>Phone Number</label>

              <div className="input-box">

                <span className="input-icon">
                  📱
                </span>

                <input
                  type="tel"
                  maxLength="10"
                  placeholder="10-digit mobile number"
                  value={mobile}
                  onChange={(e) =>
                    setMobile(
                      e.target.value.replace(/\D/g, "")
                    )
                  }
                />

              </div>

            </div>

            <div className="form-group">

              <label>Which Crops Do You Grow?</label>

              <div className="crop-box">

                <div className="crop-grid">

                  {crops.map((crop) => (
                    <label
                      key={crop}
                      className="crop-option"
                    >
                      <input
                        type="checkbox"
                        checked={selectedCrops.includes(crop)}
                        onChange={() =>
                          toggleCrop(crop)
                        }
                      />

                      {crop}

                    </label>
                  ))}

                </div>

                {selectedCrops.length > 0 && (
                  <div className="selected-crops">
                    Selected:{" "}
                    {selectedCrops.join(", ")}
                  </div>
                )}

              </div>

            </div>

            <div className="form-group">

              <label>Create Password</label>

              <div className="input-box">

                <span className="input-icon">
                  🔒
                </span>

                <input
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  placeholder="Minimum 8 characters"
                  value={password}
                  onChange={(e) =>
                    setPassword(e.target.value)
                  }
                />

                <button
                  type="button"
                  className="eye-btn"
                  onClick={() =>
                    setShowPassword(!showPassword)
                  }
                >
                  {showPassword ? "🙈" : "👁"}
                </button>

              </div>

            </div>

            <div className="form-group">

              <label>Confirm Password</label>

              <div className="input-box">

                <span className="input-icon">
                  🔐
                </span>

                <input
                  type={
                    showConfirmPassword
                      ? "text"
                      : "password"
                  }
                  placeholder="Re-enter your password"
                  value={confirmPassword}
                  onChange={(e) =>
                    setConfirmPassword(
                      e.target.value
                    )
                  }
                />

                <button
                  type="button"
                  className="eye-btn"
                  onClick={() =>
                    setShowConfirmPassword(
                      !showConfirmPassword
                    )
                  }
                >
                  {showConfirmPassword ? "🙈" : "👁"}
                </button>

              </div>

            </div>

            {error && (
              <div className="error-message">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="register-btn"
              disabled={loading}
            >
              {loading
                ? "Creating Account..."
                : "Register & Get Started →"}
            </button>

          </form>

          <div className="login-link">

            Already registered?

            <button
              onClick={() => navigate("/login")}
            >
              Sign In
            </button>

          </div>

          <div className="footer">
            🌾 Simple guidance. Smarter farming.
          </div>

        </div>

      </div>
    </>
  );
}

export default SignupPage;
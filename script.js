function formatNumber(number) {
  return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function getCachedRate() {
  const cached = localStorage.getItem("exchangeRateData");
  if (cached) {
    const { rate, timestamp } = JSON.parse(cached);
    const now = new Date().getTime();
    const oneHour = 60 * 60 * 1000;
    if (now - timestamp < oneHour) {
      return { rate, timestamp };
    }
  }
  return null;
}

async function convertCurrency() {
  const amount = document.getElementById("amount").value;
  const conversionType = document.getElementById("conversionType").value;
  const mode = document.getElementById("mode").value;
  const customRateInput = document.getElementById("customRate");
  const resultDiv = document.getElementById("result");
  const exchangeRateDiv = document.getElementById("exchangeRate");
  const sourceDiv = document.getElementById("source");

  if (!amount || amount <= 0) {
    resultDiv.innerText = "결과: 유효한 금액을 입력하세요.";
    return;
  }

  let offlineRate = parseFloat(localStorage.getItem("customOfflineRate") || "16.67");
  if (mode === "offline" && customRateInput.value && customRateInput.value > 0) {
    offlineRate = parseFloat(customRateInput.value);
    localStorage.setItem("customOfflineRate", offlineRate);
  }

  const now = new Date();
  const kst = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Seoul" }));
  const dateTime = kst.toLocaleString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  if (mode === "offline" || !navigator.onLine) {
    exchangeRateDiv.innerHTML = `환율: 1 KRW = ${formatNumber(
      offlineRate.toFixed(2)
    )} VND<br><span class="time">KST ${dateTime}</span><br><span class="rate-basis">300 KRW ≈ 5,000 VND<br>600 KRW ≈ 10,000 VND<br>1,200 KRW ≈ 20,000 VND<br>3,000 KRW ≈ 50,000 VND<br>6,000 KRW ≈ 100,000 VND<br>12,000 KRW ≈ 200,000 VND<br>30,000 KRW ≈ 500,000 VND 기준</span>`;
    sourceDiv.innerText = "출처: 사용자 지정 환율 또는 평균 환율 데이터";

    let result;
    if (conversionType === "KRWtoVND") {
      result = (amount * offlineRate).toFixed(2);
      resultDiv.innerText = `결과: ${formatNumber(amount)} KRW = ${formatNumber(result)} VND`;
    } else {
      result = (amount / offlineRate).toFixed(2);
      resultDiv.innerText = `결과: ${formatNumber(amount)} VND = ${formatNumber(result)} KRW`;
    }
  } else {
    const cached = getCachedRate();
    if (cached) {
      const { rate, timestamp } = cached;
      const updateTime = new Date(timestamp).toLocaleString("ko-KR", {
        timeZone: "Asia/Seoul",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
      exchangeRateDiv.innerHTML = `환율: 1 KRW = ${formatNumber(
        rate.toFixed(2)
      )} VND<br><span class="time">업데이트: KST ${updateTime}</span>`;
      sourceDiv.innerText = "출처: ExchangeRate-API (캐싱된 데이터)";

      let result;
      if (conversionType === "KRWtoVND") {
        result = (amount * rate).toFixed(2);
        resultDiv.innerText = `결과: ${formatNumber(amount)} KRW = ${formatNumber(result)} VND`;
      } else {
        result = (amount / rate).toFixed(2);
        resultDiv.innerText = `결과: ${formatNumber(amount)} VND = ${formatNumber(result)} KRW`;
      }
    } else {
      try {
        resultDiv.innerText = "결과: 환율 데이터를 가져오는 중...";
        const response = await fetch("https://api.exchangerate-api.com/v4/latest/KRW");
        const data = await response.json();
        const rate = data.rates.VND;
        const updateTime = new Date(data.date).toLocaleString("ko-KR", {
          timeZone: "Asia/Seoul",
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        });

        localStorage.setItem("exchangeRateData", JSON.stringify({ rate, timestamp: new Date().getTime() }));

        exchangeRateDiv.innerHTML = `환율: 1 KRW = ${formatNumber(
          rate.toFixed(2)
        )} VND<br><span class="time">업데이트: KST ${updateTime}</span>`;
        sourceDiv.innerText = "출처: ExchangeRate-API";

        let result;
        if (conversionType === "KRWtoVND") {
          result = (amount * rate).toFixed(2);
          resultDiv.innerText = `결과: ${formatNumber(amount)} KRW = ${formatNumber(result)} VND`;
        } else {
          result = (amount / rate).toFixed(2);
          resultDiv.innerText = `결과: ${formatNumber(amount)} VND = ${formatNumber(result)} KRW`;
        }
      } catch (error) {
        resultDiv.innerHTML = `결과: 환율 데이터를 가져오지 못했습니다.<br><button class="retry-button" onclick="convertCurrency()">재시도</button><br><span class="rate-basis">오프라인 모드로 전환하세요.</span>`;
        exchangeRateDiv.innerText = "환율: 데이터를 가져오지 못했습니다.";
        sourceDiv.innerText = "";
      }
    }
  }
}

document.getElementById("amount").addEventListener("input", function () {
  if (this.value && this.value > 0) {
    convertCurrency();
  } else {
    document.get7ElementById("result").innerText = "결과: 유효한 금액을 입력하세요.";
  }
});

document.getElementById("mode").addEventListener("change", function () {
  const customRateInput = document.getElementById("customRate");
  if (this.value === "offline") {
    customRateInput.style.display = "block";
    customRateInput.value = localStorage.getItem("customOfflineRate") || "16.67";
  } else {
    customRateInput.style.display = "none";
  }
});

document.addEventListener("DOMContentLoaded", function () {
  const mode = document.getElementById("mode").value;
  const customRateInput = document.getElementById("customRate");
  if (mode === "offline") {
    customRateInput.style.display = "block";
    customRateInput.value = localStorage.getItem("customOfflineRate") || "16.67";
  }
});

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const isClassFull = (siSoText, daDKText) => {
  const siSo = parseInt(siSoText, 10);
  const daDK = parseInt(daDKText, 10);
  if (!isNaN(siSo) && !isNaN(daDK)) {
    return siSo <= daDK;
  }
  return false;
};

const parseSchedule = (lichHoc, diaDiem) => {
  if (!lichHoc) return null;
  const numbers = lichHoc.match(/\d+(\.\d+)?/g);
  if (numbers && numbers.length >= 3) {
    return {
      dayOfWeek: Number(numbers[0]),
      startPeriod: Number(numbers[1]),
      endPeriod: Number(numbers[2]),
      room: diaDiem || ""
    };
  }
  return null;
};

const handleExtrasBtn = async (btn, type) => {
  if (!btn) return [];

  btn.click();
  
  // Chờ modal load (có thể mất thời gian do AJAX)
  let modalTableRows = [];
  for (let i = 0; i < 15; i++) {
    await sleep(200);
    const modalContent = document.querySelector("#fancybox-content");
    if (modalContent && modalContent.style.display !== "none") {
      const rows = modalContent.querySelectorAll("tbody tr");
      if (rows.length > 0) {
        modalTableRows = rows;
        break;
      }
    }
  }

  const danhSachExtras = [];
  for (const modalRow of modalTableRows) {
    const modalCell = modalRow.querySelectorAll("td");
    if (modalCell.length < 5) continue;

    const groupCode = modalCell[0].innerText.trim();
    const siSoText = modalCell[1].innerText.trim();
    const dangKyText = modalCell[2].innerText.trim();
    const diaDiem = modalCell[3].innerText.trim();
    const lichHoc = modalCell[4].innerText.trim();

    // Bỏ qua nếu lớp đã đầy
    if (isClassFull(siSoText, dangKyText)) {
      continue;
    }

    danhSachExtras.push({
      type,
      groupCode,
      schedule: parseSchedule(lichHoc, diaDiem),
    });
  }

  const closeBtn = document.querySelector("#fancybox-close");
  if (closeBtn) {
    closeBtn.click();
    await sleep(300);
  }
  
  return danhSachExtras;
};

const scrapeCourseData = async () => {
  const tableBody = document.querySelector("#tbPDTKQ>tbody");
  if (!tableBody) {
    alert("Không tìm thấy bảng dữ liệu");
    return;
  }

  const ketQua = [];
  const rows = tableBody.querySelectorAll("tr");

  for (const row of rows) {
    const cells = row.querySelectorAll("td");
    if (cells.length < 11) continue;

    const siSoText = cells[4].innerText.trim();
    const daDKText = cells[5].innerText.trim();

    // Bỏ qua môn học nếu lớp đã đầy
    if (isClassFull(siSoText, daDKText)) {
      continue;
    }

    const btnTH = cells[8].querySelector("a");
    const btnBT = cells[9].querySelector("a");

    const practicals = await handleExtrasBtn(btnTH, "practical");
    const exercises = await handleExtrasBtn(btnBT, "exercise");
    const subClasses = [...practicals, ...exercises];

    const courseCode = cells[0].innerText.trim();
    const courseName = cells[1].innerText.trim();
    const className = cells[2].innerText.trim();
    const creditsText = cells[3].innerText.trim();
    const lichHoc = cells[7].innerText.trim();
    const diaDiem = cells[10].innerText.trim();

    const credits = parseInt(creditsText, 10);

    const formattedCourse = {
      className,
      courseCode,
      courseName,
      credits: isNaN(credits) ? 0 : credits,
      schedule: parseSchedule(lichHoc, diaDiem),
    };

    if (subClasses.length > 0) {
      formattedCourse.subClasses = subClasses;
    }

    ketQua.push(formattedCourse);
    console.log(`Done: ${courseName}`);
  }

  const fileName = `Portal_Data_${new Date().getTime()}.json`;
  downloadJSON(ketQua, fileName);

  console.log("Scraping completed. Data:", ketQua);
};

const injectButton = () => {
  const targetElement = document.querySelector(
    "#ctl00_ContentPlaceHolder1_ctl00_div_Combobox",
  );

  if (!targetElement || document.querySelector("#btn-scrape-json")) return;

  const button = document.createElement("button");

  button.id = "btn-scrape-json";
  button.innerText = "Generate JSON";
  button.type = "button";

  Object.assign(button.style, {
    backgroundColor: "#4CAF50",
    color: "white",
    padding: "10px 15px",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
    marginLeft: "15px",
    fontWeight: "bold",
  });

  button.addEventListener("click", async () => {
    button.innerText = "Scrapping Data";
    button.disabled = true;
    button.style.backgroundColor = "#9e9e9e";

    await scrapeCourseData();

    button.innerText = "Completed";
    button.style.backgroundColor = "#4CAF50";

    setTimeout(() => {
      button.innerText = "Generate JSON";
      button.disabled = false;
    }, 2000);
  });

  targetElement.appendChild(button);
};

const downloadJSON = (data, filename) => {
  const jsonString = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonString], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

window.addEventListener("load", injectButton);

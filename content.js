// This shit is a fucking mess

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const handleExtrasBtn = async (monHoc, btn, field) => {
  if (!btn) return;

  btn.click();
  await sleep(500);

  const modalContent = document.querySelector("#fancybox-content");
  if (modalContent) {
    const modalTableRows = modalContent.querySelectorAll("tbody tr");
    const danhSachExtras = [];

    for (const modalRow of modalTableRows) {
      const modalCell = modalRow.querySelectorAll("td");
      if (modalCell.length < 5) continue;
      danhSachExtras.push({
        nhom: modalCell[0].innerText.trim(),
        siSo: modalCell[1].innerText.trim(),
        dangKy: modalCell[2].innerText.trim(),
        diaDiem: modalCell[3].innerText.trim(),
        lichHoc: modalCell[4].innerText.trim(),
      });
    }

    monHoc[field] = danhSachExtras;

    const closeBtn = document.querySelector("#fancybox-close");
    if (closeBtn) {
      closeBtn.click();
      await sleep(500);
    }
  }
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

    const monHoc = {
      maMH: cells[0].innerText.trim(),
      tenMH: cells[1].innerText.trim(),
      tenLop: cells[2].innerText.trim(),
      soTC: cells[3].innerText.trim(),
      siSo: cells[4].innerText.trim(),
      daDK: cells[5].innerText.trim(),
      khoa: cells[6].innerText.trim(),
      lichHoc: cells[7].innerText.trim(),
      nhomTH: null,
      nhomBT: null,
      diaDiem: cells[10].innerText.trim(),
    };

    const btnTH = cells[8].querySelector("a");
    const btnBT = cells[9].querySelector("a");

    await handleExtrasBtn(monHoc, btnTH, "nhomTH");
    await handleExtrasBtn(monHoc, btnBT, "nhomBT");

    if (btnTH) {
      btnTH.click();
      await sleep(500);

      const modalContent = document.querySelector("#fancybox-content");
      if (modalContent) {
        const modalTableRows = modalContent.querySelectorAll("tbody tr");
        const danhSachTH = [];

        for (const modalRow of modalTableRows) {
          const modalCell = modalRow.querySelectorAll("td");
          if (modalCell.length < 5) continue;
          danhSachTH.push({
            nhom: modalCell[0].innerText.trim(),
            siSo: modalCell[1].innerText.trim(),
            dangKy: modalCell[2].innerText.trim(),
            diaDiem: modalCell[3].innerText.trim(),
            lichHoc: modalCell[4].innerText.trim(),
          });
        }

        monHoc.danhSachTH = danhSachTH;

        const closeBtn = document.querySelector("#fancybox-close");
        if (closeBtn) {
          closeBtn.click();
          await sleep(500);
        }
      }
    }

    ketQua.push(monHoc);
    console.log(`Done: ${monHoc.tenMH}`);
    await sleep(200);
  }

  const fileName = `Portal_Data_${new Date().getTime()}.json`;
  downloadJSON(ketQua, fileName);

  console.log(ketQua);
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

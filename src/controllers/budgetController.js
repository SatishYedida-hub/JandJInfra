const ExcelJS = require("exceljs");
const asyncHandler = require("../utils/asyncHandler");

const exportBudget = asyncHandler(async (req, res) => {
  const items = Array.isArray(req.body.materials) ? req.body.materials : [];
  if (!items.length) {
    res.status(400);
    throw new Error("materials array is required");
  }

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Budget Planner");

  worksheet.columns = [
    { header: "Material", key: "material", width: 24 },
    { header: "Brand", key: "brand", width: 20 },
    { header: "Quantity", key: "quantity", width: 12 },
    { header: "Price", key: "price", width: 12 },
    { header: "Total", key: "total", width: 14 }
  ];

  let grandTotal = 0;
  items.forEach((item) => {
    const quantity = Number(item.quantity) || 0;
    const price = Number(item.price) || 0;
    const total = quantity * price;
    grandTotal += total;
    worksheet.addRow({
      material: item.name || "",
      brand: item.brand || "",
      quantity,
      price,
      total
    });
  });

  worksheet.addRow({});
  worksheet.addRow({
    material: "Grand Total",
    total: grandTotal
  });

  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true };

  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  );
  res.setHeader("Content-Disposition", "attachment; filename=budget-planner.xlsx");

  await workbook.xlsx.write(res);
  res.end();
});

module.exports = { exportBudget };

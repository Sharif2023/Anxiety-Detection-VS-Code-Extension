import express from "express";
const app = express();

app.use(express.text({ type: "text/csv", limit: "5mb" }));

app.post("/upload", (req, res) => {
  const day = req.header("X-Activity-Day") || "unknown";
  const reason = req.header("X-Activity-Reason") || "unknown";
  const csv = req.body || "";

  // TODO: save to disk/cloud storage
  // e.g., fs.writeFileSync(`/data/activity-${day}.csv`, csv);
  console.log(`Received CSV for ${day} (${reason}), length=${csv.length}`);
  res.sendStatus(204);
});

app.listen(3000, () => console.log("Listening on :3000"));

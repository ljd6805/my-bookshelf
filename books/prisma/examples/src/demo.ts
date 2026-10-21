import { openDb } from "./db.ts";
import { recordRun } from "./history.ts";
const db = openDb();
async function main() {
  const project = await db.project.upsert({ where: { key: "AX-LEARN" }, update: {},
    create: { key: "AX-LEARN", name: "학습용 작업 이력", tasks: { create: { title: "메일 분류 예제" } } },
    include: { tasks: { orderBy: { id: "asc" } } } });
  const task = project.tasks[0];
  if (!task) throw new Error("예제 작업이 없습니다. 학습용 DB 상태를 확인하세요.");
  await recordRun(db, task.id, "demo-run-1", true);
  await recordRun(db, task.id, "demo-run-1", true);
  console.log(JSON.stringify(await db.task.findUnique({ where: { id: task.id },
    select: { title: true, status: true, runs: { select: { requestKey: true, success: true } } } }), null, 2));
}
try { await main(); } finally { await db.$disconnect(); }

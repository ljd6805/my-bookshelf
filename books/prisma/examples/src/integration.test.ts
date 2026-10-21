import { before, after, beforeEach, test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { execFileSync } from "node:child_process";
import { openDb } from "./db.ts";
import { recordRun } from "./history.ts";
const folder = mkdtempSync(join(tmpdir(), "prisma-book-test-"));
const url = `file:${join(folder, "test.db")}`;
const db = openDb(url);
before(() => {
  execFileSync(process.execPath, [resolve("node_modules/prisma/build/index.js"), "migrate", "deploy"], {
    env: { ...process.env, DATABASE_URL: url }, stdio: "pipe",
  });
});
beforeEach(async () => {
  await db.run.deleteMany(); await db.task.deleteMany(); await db.project.deleteMany();
});
after(async () => { await db.$disconnect(); rmSync(folder, { recursive: true, force: true }); });
async function fixture() {
  return db.project.create({ data: { key: "TEST", name: "검증 전용", tasks: { create: [
    { title: "첫 작업" }, { title: "둘째 작업", status: "DONE" }, { title: "셋째 작업" },
  ] } }, include: { tasks: { orderBy: { id: "asc" } } } });
}
test("필터·정렬·select는 실제 SQLite 결과를 반환한다", async () => {
  const p = await fixture();
  const rows = await db.task.findMany({ where: { projectId: p.id, status: "DONE" }, select: { title: true }, orderBy: { id: "asc" } });
  assert.deepEqual(rows, [{ title: "둘째 작업" }]);
});
test("고유 키 중복은 DB에서 거절된다", async () => {
  await fixture();
  await assert.rejects(db.project.create({ data: { key: "TEST", name: "중복" } }), { code: "P2002" });
});
test("없는 부모를 참조하는 작업은 저장되지 않는다", async () => {
  await assert.rejects(db.task.create({ data: { title: "고아 작업", projectId: 999999 } }));
  assert.equal(await db.task.count(), 0);
});
test("트랜잭션 중 오류는 첫 쓰기도 되돌린다", async () => {
  const p = await fixture();
  await assert.rejects(db.$transaction(async tx => {
    await tx.task.update({ where: { id: p.tasks[0].id }, data: { status: "DONE" } });
    throw new Error("실패 주입");
  }), /실패 주입/);
  assert.equal((await db.task.findUniqueOrThrow({ where: { id: p.tasks[0].id } })).status, "TODO");
});
test("동일 요청의 순차 재시도는 실행 이력을 늘리지 않는다", async () => {
  const p = await fixture(); const id = p.tasks[0].id;
  const a = await recordRun(db, id, "req-1", true);
  const b = await recordRun(db, id, "req-1", true);
  assert.equal(a.id, b.id); assert.equal(await db.run.count(), 1);
  assert.equal((await db.task.findUniqueOrThrow({ where: { id } })).status, "DONE");
});
test("요청 키 재사용 시 입력이 다르면 거절한다", async () => {
  const p = await fixture();
  await recordRun(db, p.tasks[0].id, "req-1", true);
  await assert.rejects(recordRun(db, p.tasks[1].id, "req-1", true), /서로 다른/);
  await assert.rejects(recordRun(db, p.tasks[0].id, "req-1", false), /서로 다른/);
  assert.equal(await db.run.count(), 1);
});
test("cursor의 skip:1은 기준 행 중복을 피한다", async () => {
  const p = await fixture();
  const rows = await db.task.findMany({ cursor: { id: p.tasks[0].id }, skip: 1, take: 2, orderBy: { id: "asc" } });
  assert.deepEqual(rows.map(x => x.title), ["둘째 작업", "셋째 작업"]);
});
test("자식이 있는 프로젝트 삭제를 Restrict가 막는다", async () => {
  const p = await fixture();
  await assert.rejects(db.project.delete({ where: { id: p.id } }));
  assert.equal(await db.task.count(), 3);
});

test("서버의 프로젝트 범위와 다른 작업은 수정하지 않는다", async () => {
  const { changeStatusForProject } = await import("./scoped-update.ts");
  const p = await fixture();
  await assert.rejects(changeStatusForProject(db, p.id + 1, p.tasks[0].id, "DONE"), /권한/);
  assert.equal((await db.task.findUniqueOrThrow({ where: { id: p.tasks[0].id } })).status, "TODO");
  assert.deepEqual(await changeStatusForProject(db, p.id, p.tasks[0].id, "DONE"), { count: 1 });
});
test("타입 선언 밖에서 들어오는 잘못된 상태를 거절한다", async () => {
  const { changeStatusForProject } = await import("./scoped-update.ts");
  const p = await fixture();
  await assert.rejects(changeStatusForProject(db, p.id, p.tasks[0].id, "ADMIN"), /확인/);
  await assert.rejects(changeStatusForProject(db, p.id, NaN, "DONE"), /확인/);
});

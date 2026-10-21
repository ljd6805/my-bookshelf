import type { PrismaClient } from "../generated/prisma/client.ts";
// trustedProjectId는 인증/인가 계층이 검증한 서버 문맥이어야 합니다.
// 요청 본문의 projectId를 그대로 넘겨서는 안 됩니다.
export async function changeStatusForProject(
  db: PrismaClient, trustedProjectId: number, taskId: number, status: unknown,
) {
  if (!Number.isSafeInteger(trustedProjectId) || trustedProjectId < 1 ||
      !Number.isSafeInteger(taskId) || taskId < 1 ||
      typeof status !== "string" || !["TODO", "DONE", "FAILED"].includes(status)) {
    throw new Error("작업 ID·프로젝트 ID·상태를 확인하세요.");
  }
  const result = await db.task.updateMany({
    where: { id: taskId, projectId: trustedProjectId }, data: { status },
  });
  if (result.count !== 1) throw new Error("작업이 없거나 변경 권한이 없습니다.");
  return result;
}

/**
 * E2E 测试后置清理脚本：删除测试用户的 usage / reviews / paywall_events
 *
 * 用法：
 *   npx tsx scripts/e2e/cleanup-test-user.ts <github_user_id>
 *
 * 示例：
 *   npx tsx scripts/e2e/cleanup-test-user.ts checkaicode-e2e
 */
import { prisma } from "@/lib/prisma";

const TEST_USER_EMAIL = "checkaicode-e2e@users.noreply.github.com";

async function main() {
  const userId = process.argv[2];
  if (!userId) {
    console.error("Usage: npx tsx scripts/e2e/cleanup-test-user.ts <github_user_id>");
    process.exit(1);
  }

  // 1. 删除 reviews
  const reviewsDeleted = await prisma.review.deleteMany({
    where: {
      OR: [
        { userId },
        { user: { email: TEST_USER_EMAIL } },
      ],
    },
  });
  console.log(`Deleted ${reviewsDeleted.count} review(s).`);

  // 2. 删除 usage（所有日期）
  const usageDeleted = await prisma.usage.deleteMany({
    where: {
      OR: [
        { userId },
        { userId: { startsWith: "anon_e2e_" } },
      ],
    },
  });
  console.log(`Deleted ${usageDeleted.count} usage record(s).`);

  // 3. 删除 paywall_events
  const paywallDeleted = await prisma.paywallEvent.deleteMany({
    where: {
      OR: [
        { userId },
        { ip: { startsWith: "e2e_" } },
      ],
    },
  });
  console.log(`Deleted ${paywallDeleted.count} paywall event(s).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

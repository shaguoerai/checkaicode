/**
 * E2E 测试前置脚本：重置测试用户为 free，清空当天 usage
 *
 * 用法：
 *   npx tsx scripts/e2e/reset-test-user.ts <github_user_id>
 *
 * 示例：
 *   npx tsx scripts/e2e/reset-test-user.ts checkaicode-e2e
 */
import { prisma } from "@/lib/prisma";

const TEST_USER_EMAIL = "checkaicode-e2e@users.noreply.github.com";

async function main() {
  const userId = process.argv[2];
  if (!userId) {
    console.error("Usage: npx tsx scripts/e2e/reset-test-user.ts <github_user_id>");
    process.exit(1);
  }

  const today = new Date().toISOString().split("T")[0];

  // 1. 重置用户为 free（清除所有 Pro 标记）
  const user = await prisma.user.updateMany({
    where: {
      OR: [
        { id: userId },
        { email: TEST_USER_EMAIL },
        { name: userId },
      ],
    },
    data: {
      role: "free",
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      stripePriceId: null,
      stripeCurrentPeriodEnd: null,
      gumroadLicenseKey: null,
      gumroadProductId: null,
      gumroadSubscriptionId: null,
      gumroadCurrentPeriodEnd: null,
    },
  });

  console.log(`Reset ${user.count} user(s) to free plan.`);

  // 2. 清空当天 usage
  const usageDeleted = await prisma.usage.deleteMany({
    where: {
      userId,
      date: today,
    },
  });

  console.log(`Deleted ${usageDeleted.count} usage record(s) for ${today}.`);

  // 3. 也清一下 anon 的（如果 E2E 用 anon 模式跑过）
  const anonDeleted = await prisma.usage.deleteMany({
    where: {
      userId: { startsWith: "anon_e2e_" },
      date: today,
    },
  });

  console.log(`Deleted ${anonDeleted.count} anon e2e usage record(s).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

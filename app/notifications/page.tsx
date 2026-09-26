import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import AppShell from "@/app/components/shell";
import NotificationsClient from "@/app/notifications/notifications-client";

export const metadata: Metadata = {
  title: "Notifications",
  description: "Your notification channels and delivery settings",
};

export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  const user = await getCurrentUser();
  if (!user) {
    return (
      <AppShell active="notifications" user={null}>
        <div className="text-center py-12">
          <p className="text-graphite-muted">Please sign in to view notifications.</p>
        </div>
      </AppShell>
    );
  }

  const [totalNotifications, deliveredCount, failedCount] = await Promise.all([
    prisma.notification.count({
      where: { userId: user.id },
    }),
    prisma.notification.count({
      where: { userId: user.id, status: "DELIVERED" },
    }),
    prisma.notification.count({
      where: { userId: user.id, status: "FAILED" },
    }),
  ]);

  return (
    <AppShell active="notifications" user={{ name: user.name, email: user.email }}>
      <NotificationsClient
        user={user}
        totalNotifications={totalNotifications}
        deliveredCount={deliveredCount}
        failedCount={failedCount}
      />
    </AppShell>
  );
}
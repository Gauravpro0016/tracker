import { Metadata } from "next";
import PublicProfileView from "./PublicProfileView";

interface Props {
  params: { username: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const username = params.username.toLowerCase();
  const baseUrl = process.env.NEXTAUTH_URL || "https://focusdesk.app";

  try {
    const res = await fetch(`${baseUrl}/api/users/${username}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) {
      return {
        title: `Scholar Profile | FocusDesk`,
        description: `Explore dedicated study stats, milestones, and streaks on FocusDesk.`,
      };
    }
    const data = await res.json();
    const { user, stats, achievements } = data;

    const title = `${user.name} (@${user.username}) — Study Stats & Achievements | FocusDesk`;
    const description = `${user.name} has logged ${stats.totalHours} hours of deep work with a ${stats.currentStreak}-day streak and unlocked ${achievements?.totalUnlocked || 0} milestone badges on FocusDesk.`;

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        url: `${baseUrl}/u/${user.username}`,
        siteName: "FocusDesk",
        images: user.avatar ? [{ url: user.avatar }] : [{ url: "/og-image.png" }],
        type: "profile",
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: user.avatar ? [user.avatar] : ["/og-image.png"],
      },
    };
  } catch {
    return {
      title: `@${username} | FocusDesk Study Profile`,
      description: `Explore study stats, hour milestones, and streaks on FocusDesk.`,
    };
  }
}

export default function PublicProfilePage({ params }: Props) {
  return <PublicProfileView username={params.username} />;
}


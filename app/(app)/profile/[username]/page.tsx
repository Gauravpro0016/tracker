import { redirect } from "next/navigation";

export default function ProfileRedirectPage({
  params,
}: {
  params: { username: string };
}) {
  redirect(`/u/${params.username}`);
}


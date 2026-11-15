// app/sitemap.ts
import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXTAUTH_URL || "https://focusdesk.app";
  const routes = ["", "/ai", "/dashboard", "/analytics", "/leaderboard", "/habits", "/goals", "/planner", "/appearance", "/login", "/register", "/contact"];

  return routes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: route === "" || route === "/leaderboard" ? "daily" : "weekly",
    priority: route === "" ? 1.0 : 0.8,
  }));
}
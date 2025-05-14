<template>
  <div class="max-w-3xl mx-auto p-5">
    <div v-for="repo in repositories" :key="repo.name" class="mb-8">
      <h3 class="text-xl font-semibold mb-4">{{ repo.name }}</h3>
      <div v-if="repo.issues.length === 0" class="p-4 text-gray-500 italic">
        このリポジトリにはissueとpull requestがありません。
      </div>
      <template v-else>
        <div
          v-for="issue in repo.issues"
          :key="issue.id"
          class="border border-gray-200 rounded-lg mb-3 overflow-hidden"
        >
          <div
            class="p-4 bg-gray-100 hover:bg-gray-100 cursor-pointer flex justify-between items-center"
            @click="toggleIssue(repo.name, issue.id)"
          >
            <div class="flex items-center gap-2">
              <span
                class="px-2 py-1 text-xs rounded-full text-white font-bold"
                :class="{
                  'bg-green-500 ': issue.type === 'pull_request',
                  'bg-blue-500': issue.type === 'issue',
                }"
              >
                {{ issue.type === "pull_request" ? "PR" : "Issue" }} #{{
                  issue.number
                }}
              </span>
              <h4 class="font-medium">{{ issue.title }}</h4>
            </div>
            <span class="text-xs text-gray-500">{{
              isOpen(repo.name, issue.id) ? "▼" : "▶"
            }}</span>
          </div>
          <div
            v-if="isOpen(repo.name, issue.id)"
            class="p-4 border-t border-gray-200"
          >
            <div
              class="prose prose-sm max-w-none prose-headings:font-semibold prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg prose-p:text-gray-700 prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline prose-code:text-sm prose-code:bg-gray-100 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-pre:bg-gray-100 prose-pre:p-4 prose-pre:rounded-lg prose-pre:overflow-x-auto prose-ul:list-disc prose-ol:list-decimal prose-li:marker:text-gray-500"
              v-html="renderMarkdown(issue.body)"
            ></div>
            <div
              v-if="issue.images && issue.images.length > 0"
              class="mt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3"
            >
              <img
                v-for="(image, index) in issue.images"
                :key="index"
                :src="image"
                :alt="`Issue image ${index + 1}`"
                class="w-full h-auto rounded"
              />
            </div>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { Octokit } from "@octokit/rest";
import MarkdownIt from "markdown-it";
import DOMPurify from "dompurify";

interface Issue {
  id: number;
  title: string;
  body: string;
  images: string[];
  type: "issue" | "pull_request";
  number: number;
}

interface Repository {
  name: string;
  owner: string;
  link: string;
  issues: Issue[];
}

const octokit = new Octokit();
const md = new MarkdownIt();

const repositories = ref<Repository[]>([
  {
    name: "tokiwa-calendar-frontend",
    owner: "HikariTakahashi",
    link: "https://github.com/HikariTakahashi/tokiwa-calendar-frontend",
    issues: [],
  },
  {
    name: "tokiwa-calendar-backend",
    owner: "HikariTakahashi",
    link: "https://github.com/HikariTakahashi/tokiwa-calendar-backend",
    issues: [],
  },
  {
    name: "tokiwa-calendar-hardware",
    owner: "HikariTakahashi",
    link: "https://github.com/HikariTakahashi/tokiwa-calendar-hardware",
    issues: [],
  },
  {
    name: "tokiwa-calendar-discordbot",
    owner: "HikariTakahashi",
    link: "https://github.com/HikariTakahashi/tokiwa-calendar-discordbot",
    issues: [],
  },
]);

const openIssues = ref<{ [key: string]: boolean }>({});

const isOpen = (repoName: string, issueId: number) => {
  return openIssues.value[`${repoName}-${issueId}`] || false;
};

const toggleIssue = (repoName: string, issueId: number) => {
  const key = `${repoName}-${issueId}`;
  openIssues.value[key] = !openIssues.value[key];
};

const renderMarkdown = (content: string) => {
  const rawHtml = md.render(content || "");
  return DOMPurify.sanitize(rawHtml);
};

const extractImages = (body: string) => {
  const imageRegex = /!\[.*?\]\((.*?)\)/g;
  const images: string[] = [];
  let match;
  while ((match = imageRegex.exec(body)) !== null) {
    images.push(match[1]);
  }
  return images;
};

const fetchIssues = async () => {
  for (const repo of repositories.value) {
    try {
      const [issuesResponse, pullsResponse] = await Promise.all([
        octokit.issues.listForRepo({
          owner: repo.owner,
          repo: repo.name,
          state: "open",
        }),
        octokit.pulls.list({
          owner: repo.owner,
          repo: repo.name,
          state: "open",
        }),
      ]);

      const issues = issuesResponse.data
        .filter((issue) => !issue.pull_request)
        .map((issue) => ({
          id: issue.id,
          title: issue.title,
          body: issue.body || "",
          images: extractImages(issue.body || ""),
          type: "issue" as const,
          number: issue.number,
        }));

      const pullRequests = pullsResponse.data.map((pr) => ({
        id: pr.id,
        title: pr.title,
        body: pr.body || "",
        images: extractImages(pr.body || ""),
        type: "pull_request" as const,
        number: pr.number,
      }));

      repo.issues = [...issues, ...pullRequests].sort(
        (a, b) => b.number - a.number
      );
    } catch (error) {
      console.error(`Error fetching issues for ${repo.name}:`, error);
    }
  }
};

onMounted(() => {
  fetchIssues();
});
</script>

<template>
  <div class="max-w-3xl mx-auto p-5">
    <div class="mb-8">
      <h3 class="text-xl font-semibold mb-4">
        <a
          :href="link"
          target="_blank"
          rel="noopener noreferrer"
          class="hover:text-blue-600 transition-colors"
        >
          {{ name }}
        </a>
      </h3>
      <div v-if="issues.length === 0" class="p-4 text-gray-500 italic">
        このリポジトリにはissueとpull requestがありません。
      </div>
      <template v-else>
        <div
          v-for="issue in issues"
          :key="issue.id"
          class="border border-gray-200 rounded-lg mb-3 overflow-hidden"
        >
          <div
            class="md:p-2 bg-gray-100 hover:bg-gray-100 cursor-pointer flex justify-between items-center"
            @click="toggleIssue(issue.id)"
          >
            <div class="flex items-center gap-2 max-w-40 md:max-w-none">
              <span
                class="px-1.5 md:px-2 py-1 text-xs rounded-full text-white font-bold"
                :class="{
                  'bg-green-500 min-w-14': issue.type === 'pull_request',
                  'bg-blue-500 min-w-16': issue.type === 'issue',
                }"
              >
                {{ issue.type === "pull_request" ? "PR" : "Issue" }} #{{
                  issue.number
                }}
              </span>
              <h4 class="text-xs md:text-base font-medium">
                {{ issue.title }}
              </h4>
            </div>

            <div class="flex items-center gap-2">
              <div class="flex items-center gap-2">
                <img
                  v-for="assignee in issue.assignees"
                  :key="assignee.login"
                  :src="assignee.avatar_url"
                  :alt="assignee.login"
                  class="w-6 h-6 rounded-full"
                />
              </div>
              <div class="flex items-center gap-2" />
              <a
                :href="`https://github.com/${owner}/${name}/${
                  issue.type === 'pull_request' ? 'pull' : 'issues'
                }/${issue.number}`"
                target="_blank"
                rel="noopener noreferrer"
                class="p-1.5 pb-0.5 text-xs md:text-sm bg-gray-200 hover:bg-gray-300 rounded transition-colors"
                @click.stop
              >
                <Icon name="grommet-icons:github" class="size-6" />
              </a>
            </div>
          </div>
          <div v-if="isOpen(issue.id)" class="p-4 border-t border-gray-200">
            <h6 v-for="assignee in issue.assignees" :key="assignee.login">
              担当者:{{ assignee.login }}
            </h6>
            <div
              class="prose prose-sm max-w-none prose-headings:font-semibold prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg prose-p:text-gray-700 prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline prose-code:text-sm prose-code:bg-gray-100 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-pre:bg-gray-100 prose-pre:p-4 prose-pre:rounded-lg prose-pre:overflow-x-auto prose-ul:list-disc prose-ol:list-decimal prose-li:marker:text-gray-500"
              v-html="renderMarkdown(issue.body)"
            />
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
  assignees: {
    login: string;
    avatar_url: string;
  }[];
}

const props = defineProps<{
  name: string;
  owner: string;
  link: string;
}>();

const octokit = new Octokit();
const md = new MarkdownIt();

const issues = ref<Issue[]>([]);
const openIssues = ref<{ [key: string]: boolean }>({});

const isOpen = (issueId: number) => {
  return openIssues.value[issueId] || false;
};

const toggleIssue = (issueId: number) => {
  openIssues.value[issueId] = !openIssues.value[issueId];
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
  try {
    const [issuesResponse, pullsResponse] = await Promise.all([
      octokit.issues.listForRepo({
        owner: props.owner,
        repo: props.name,
        state: "open",
      }),
      octokit.pulls.list({
        owner: props.owner,
        repo: props.name,
        state: "open",
      }),
    ]);

    const issuesList = issuesResponse.data
      .filter((issue) => !issue.pull_request)
      .map((issue) => ({
        id: issue.id,
        title: issue.title,
        body: issue.body || "",
        images: extractImages(issue.body || ""),
        type: "issue" as const,
        number: issue.number,
        assignees: (issue.assignees || []).map((assignee) => ({
          login: assignee.login,
          avatar_url: assignee.avatar_url,
        })),
      }));

    const pullRequests = pullsResponse.data.map((pr) => ({
      id: pr.id,
      title: pr.title,
      body: pr.body || "",
      images: extractImages(pr.body || ""),
      type: "pull_request" as const,
      number: pr.number,
      assignees: (pr.assignees || []).map((assignee) => ({
        login: assignee.login,
        avatar_url: assignee.avatar_url,
      })),
    }));

    issues.value = [...issuesList, ...pullRequests].sort(
      (a, b) => b.number - a.number
    );
  } catch (error) {
    console.error(`Error fetching issues for ${props.name}:`, error);
  }
};

onMounted(() => {
  fetchIssues();
});
</script>

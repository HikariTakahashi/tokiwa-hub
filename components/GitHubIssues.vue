<template>
  <div class="github-issues">
    <div v-for="repo in repositories" :key="repo.name" class="repo-section">
      <h3>{{ repo.name }}</h3>
      <div v-if="repo.issues.length === 0" class="no-issues">
        このリポジトリにはissueがありません。
      </div>
      <div
        v-else
        v-for="issue in repo.issues"
        :key="issue.id"
        class="issue-card"
      >
        <div class="issue-header" @click="toggleIssue(repo.name, issue.id)">
          <h4>{{ issue.title }}</h4>
          <span class="toggle-icon">{{
            isOpen(repo.name, issue.id) ? "▼" : "▶"
          }}</span>
        </div>
        <div v-if="isOpen(repo.name, issue.id)" class="issue-content">
          <div class="markdown-body" v-html="renderMarkdown(issue.body)"></div>
          <div
            v-if="issue.images && issue.images.length > 0"
            class="issue-images"
          >
            <img
              v-for="(image, index) in issue.images"
              :key="index"
              :src="image"
              :alt="`Issue image ${index + 1}`"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { Octokit } from "@octokit/rest";
import { marked } from "marked";

const octokit = new Octokit();

const repositories = ref([
  {
    name: "tokiwa-calendar-frontend",
    owner: "HikariTakahashi",
    issues: [],
  },
  {
    name: "tokiwa-calendar-backend",
    owner: "HikariTakahashi",
    issues: [],
  },
  {
    name: "tokiwa-calendar-hardware",
    owner: "HikariTakahashi",
    issues: [],
  },
  {
    name: "tokiwa-calendar-discordbot",
    owner: "HikariTakahashi",
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
  return marked(content || "");
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
      const response = await octokit.issues.listForRepo({
        owner: repo.owner,
        repo: repo.name,
        state: "open",
      });

      repo.issues = response.data.map((issue) => ({
        id: issue.id,
        title: issue.title,
        body: issue.body || "",
        images: extractImages(issue.body || ""),
      }));
    } catch (error) {
      console.error(`Error fetching issues for ${repo.name}:`, error);
    }
  }
};

onMounted(() => {
  fetchIssues();
});
</script>

<style scoped>
.github-issues {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.repo-section {
  margin-bottom: 30px;
}

.issue-card {
  border: 1px solid #e1e4e8;
  border-radius: 6px;
  margin-bottom: 10px;
  overflow: hidden;
}

.issue-header {
  padding: 15px;
  background-color: #f6f8fa;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.issue-header:hover {
  background-color: #f1f3f5;
}

.issue-content {
  padding: 15px;
  border-top: 1px solid #e1e4e8;
}

.issue-images {
  margin-top: 15px;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 10px;
}

.issue-images img {
  max-width: 100%;
  height: auto;
  border-radius: 4px;
}

.markdown-body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial,
    sans-serif;
  font-size: 16px;
  line-height: 1.5;
  word-wrap: break-word;
}

.markdown-body :deep(h1),
.markdown-body :deep(h2),
.markdown-body :deep(h3),
.markdown-body :deep(h4),
.markdown-body :deep(h5),
.markdown-body :deep(h6) {
  margin-top: 24px;
  margin-bottom: 16px;
  font-weight: 600;
  line-height: 1.25;
}

.markdown-body :deep(p) {
  margin-top: 0;
  margin-bottom: 16px;
}

.markdown-body :deep(code) {
  padding: 0.2em 0.4em;
  margin: 0;
  font-size: 85%;
  background-color: rgba(27, 31, 35, 0.05);
  border-radius: 3px;
}

.markdown-body :deep(pre) {
  padding: 16px;
  overflow: auto;
  font-size: 85%;
  line-height: 1.45;
  background-color: #f6f8fa;
  border-radius: 3px;
}

.markdown-body :deep(blockquote) {
  padding: 0 1em;
  color: #6a737d;
  border-left: 0.25em solid #dfe2e5;
  margin: 0 0 16px 0;
}

.markdown-body :deep(ul),
.markdown-body :deep(ol) {
  padding-left: 2em;
  margin-top: 0;
  margin-bottom: 16px;
}

.markdown-body :deep(table) {
  display: block;
  width: 100%;
  overflow: auto;
  margin-top: 0;
  margin-bottom: 16px;
  border-spacing: 0;
  border-collapse: collapse;
}

.markdown-body :deep(table th),
.markdown-body :deep(table td) {
  padding: 6px 13px;
  border: 1px solid #dfe2e5;
}

.markdown-body :deep(table tr) {
  background-color: #fff;
  border-top: 1px solid #c6cbd1;
}

.markdown-body :deep(table tr:nth-child(2n)) {
  background-color: #f6f8fa;
}

.markdown-body :deep(img) {
  max-width: 100%;
  box-sizing: content-box;
  background-color: #fff;
}

.toggle-icon {
  font-size: 12px;
  color: #586069;
}

.no-issues {
  padding: 15px;
  color: #586069;
  font-style: italic;
}
</style>

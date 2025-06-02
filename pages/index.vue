<template>
  <div class="container mx-auto px-4 py-8">
    <h1 class="text-3xl font-bold mb-8">TokiWa hub(試験版)</h1>
    <GitHubIssues
      name="tokiwa-calendar-frontend"
      owner="HikariTakahashi"
      link="https://github.com/HikariTakahashi/tokiwa-calendar-frontend"
    />
    <GitHubIssues
      name="tokiwa-calendar-backend"
      owner="HikariTakahashi"
      link="https://github.com/HikariTakahashi/tokiwa-calendar-backend"
    />
    <GitHubIssues
      name="tokiwa-calendar-hardware"
      owner="HikariTakahashi"
      link="https://github.com/HikariTakahashi/tokiwa-calendar-hardware"
    />
    <GitHubIssues
      name="tokiwa-calendar-discordbot"
      owner="HikariTakahashi"
      link="https://github.com/HikariTakahashi/tokiwa-calendar-discordbot"
    />
    <GitHubIssues
      name="tokiwa-hub"
      owner="HikariTakahashi"
      link="https://github.com/HikariTakahashi/tokiwa-hub"
    />
  </div>
</template>

<script setup lang="ts">
import GitHubIssues from "~/components/GitHubIssues.vue";
</script>

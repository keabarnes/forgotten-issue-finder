import { getInput, setOutput, setFailed } from "@actions/core";
import { context, getOctokit } from "@actions/github";

import { removeDuplicateLinks } from "./utils";

const GITHUB_TOKEN = getInput("github-token") || process.env.GITHUB_TOKEN;
const IGNORE_LABEL = getInput("ignore-label") || process.env.IGNORE_LABEL;

const run = async () => {
  if (!GITHUB_TOKEN)
    throw new Error(
      "GitHub token not found, please set `github-token` input or `GITHUB_TOKEN` environment variable."
    );

  const { owner, repo } = context.repo;
  const octokit = getOctokit(GITHUB_TOKEN);

  octokit
    .paginate(octokit.issues.listForRepo, {
      owner,
      repo,
      filter: "all",
      state: "open",
    })
    .then((issues) => {
      let outputIssueLinks: Array<string> = [];
      issues.map(async (issue) => {
        if (!issue.pull_request) {
          const {
            data: timelineEvents,
          } = await octokit.issues.listEventsForTimeline({
            owner,
            repo,
            issue_number: issue.number,
          });
          timelineEvents.map((timelineEvent) => {
            if (timelineEvent.event === "cross-referenced") {
              // @ts-expect-error @octokit types need to be updated to include a "source" for "cross-referenced" event type
              const timelineSourceType = timelineEvent.source.type;
              // @ts-expect-error @octokit types need to be updated to include a "source" for "cross-referenced" event type
              const timelineSourceIssue = timelineEvent.source.issue;
              const timelineSourceState = timelineSourceIssue.state;
              const timelineSourceIsPr = !!timelineSourceIssue.pull_request;
              const timelineSourceUrl = issue.html_url;

              // Check that the given label doesn't exist on the issue to check against allow-listed issues
              const isIgnoreLabelPresent =
                IGNORE_LABEL &&
                issue.labels.findIndex(
                  (label) => label.name === IGNORE_LABEL
                ) >= 0;

              // Get the times of both to make sure the issue was before the PR
              // (the issue wasn't created from something in the PR)
              const issueCreated = new Date(issue.created_at);
              const prCreated = new Date(timelineSourceIssue.created_at);

              if (
                timelineSourceType === "issue" &&
                timelineSourceState === "closed" &&
                timelineSourceIsPr &&
                prCreated > issueCreated &&
                !isIgnoreLabelPresent
              ) {
                outputIssueLinks.push(timelineSourceUrl);
              }
            }
          });
        }
      });
      setOutput("issue-links", removeDuplicateLinks(outputIssueLinks));
    });
};

run().catch((error) => {
  setFailed(error.message);
});

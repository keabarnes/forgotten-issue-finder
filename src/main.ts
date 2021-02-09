import { Octokit } from "@octokit/rest";

const octokit = new Octokit({
  auth: "AUTH_TOKEN_HERE",
});

const OWNER = "***REMOVED***";
const REPO = "***REMOVED***";

const main = async () => {
  octokit
    .paginate(octokit.issues.listForRepo, {
      owner: OWNER,
      repo: REPO,
      filter: "all",
      state: "open",
    })
    .then((issues) => {
      issues.map(async (issue) => {
        if (!issue.pull_request) {
          const {
            data: timelineEvents,
          } = await octokit.issues.listEventsForTimeline({
            owner: OWNER,
            repo: REPO,
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
                issue.labels.findIndex(
                  (label) => label.name === "Cleanup: Ignore"
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
                console.log(timelineSourceUrl);
              }
            }
          });
        }
      });
    });
};

main();

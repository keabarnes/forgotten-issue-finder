# Forgotten issue finder action

This action looks through the issues of a repo and finds any that have a merged PR referencing them. It outputs a list of issue links, which can be fed to a Slack message on a weekly/monthly cron job to make sure all issues that PRs have been made for are closed correctly.

## Inputs

### `ignore-label`

Issue label which can be used to mark issues to ignore them.

### `github-token`

Optional Github token, defaults to use `github.token` from run context.

## Outputs

### `issue-links`

List of links that need to be checked.

## Example usage

```yaml
name: Find forgotten issues
on:
  schedule:
    - cron: "0 0 * * 1"

jobs:
  find-issues:
    runs-on: ubuntu-latest
    steps:
      - name: Find the issues
        id: forgotten-issue-finder
        uses: keabarnes/forgotten-issue-finder@v1.0.0
        with:
          ignore-label: "Cleanup: ignore"
      - name: Slack Notification
        uses: rtCamp/action-slack-notify@v2
        env:
          ...
          SLACK_MESSAGE: ${{ steps.forgotten-issue-finder.outputs.issue-list }}
          ...
```

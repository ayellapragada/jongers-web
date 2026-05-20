<script lang="ts">
  let { dueCount, totalCount, sessionCorrect, sessionAttempted }: {
    dueCount: number;
    totalCount: number;
    sessionCorrect: number;
    sessionAttempted: number;
  } = $props();
</script>

<div class="strip">
  Queue: {dueCount} due · {totalCount} total · session: {sessionCorrect}/{sessionAttempted} ✓
</div>

<style>
  .strip {
    padding: 0.5rem 1rem; font-size: 0.9rem; color: #555;
    background: #f5f5f5; border-bottom: 1px solid #eee;
  }
</style>

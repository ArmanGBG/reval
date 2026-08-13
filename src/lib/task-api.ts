type TaskTopicRow = {
  topic: { id: string; title: string; topicNo: number; chapterId: string };
};

export const taskTopicInclude = {
  topics: {
    include: { topic: { select: { id: true, title: true, topicNo: true, chapterId: true } } },
  },
} as const;

export function parseTaskResponse(task: Record<string, unknown> & { topics?: TaskTopicRow[] }): Record<string, unknown> {
  let activityTypes = task.activityTypes;
  if (typeof activityTypes === 'string') {
    try { activityTypes = JSON.parse(activityTypes); } catch { activityTypes = null; }
  }
  const topics = (task.topics ?? []).map((row) => row.topic).sort((a, b) => a.topicNo - b.topicNo);
  return {
    ...task,
    activityTypes,
    topics,
    topicIds: topics.map((topic) => topic.id),
  };
}

export function taskPatchData(body: Record<string, unknown>, allowedFields: readonly string[]) {
  const data: Record<string, unknown> = {};
  for (const key of allowedFields) {
    if (key !== 'topicIds' && body[key] !== undefined) data[key] = body[key];
  }
  return data;
}

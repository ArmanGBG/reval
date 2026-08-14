type TaskTopicRow = {
  topic: { id: string; title: string; topicNo: number; chapterId: string };
};

type TaskTopicModeSubtopicRow = {
  subtopic: { id: string; title: string; subtopicNo: number; topicModeId: string };
};

export const taskTopicInclude = {
  topics: {
    include: { topic: { select: { id: true, title: true, topicNo: true, chapterId: true } } },
  },
  topicModeSubtopics: {
    include: { subtopic: { select: { id: true, title: true, subtopicNo: true, topicModeId: true } } },
  },
} as const;

export function parseTaskResponse(task: Record<string, unknown> & { topics?: TaskTopicRow[]; topicModeSubtopics?: TaskTopicModeSubtopicRow[] }): Record<string, unknown> {
  let activityTypes = task.activityTypes;
  if (typeof activityTypes === 'string') {
    try { activityTypes = JSON.parse(activityTypes); } catch { activityTypes = null; }
  }
  const topics = (task.topics ?? []).map((row) => row.topic).sort((a, b) => a.topicNo - b.topicNo);
  const topicModeSubtopics = (task.topicModeSubtopics ?? []).map((row) => row.subtopic).sort((a, b) => a.subtopicNo - b.subtopicNo);
  return {
    ...task,
    activityTypes,
    topics,
    topicIds: topics.map((topic) => topic.id),
    topicModeSubtopics,
    topicModeSubtopicIds: topicModeSubtopics.map((subtopic) => subtopic.id),
    teacherClassName: (task.teacherClassName as string | null) ?? null,
    sessionNumber: (task.sessionNumber as string | null) ?? null,
    bookName: (task.bookName as string | null) ?? null,
    testDescription: (task.testDescription as string | null) ?? null,
  };
}

export function taskPatchData(body: Record<string, unknown>, allowedFields: readonly string[]) {
  const data: Record<string, unknown> = {};
  for (const key of allowedFields) {
    if (key !== 'topicIds' && key !== 'topicModeSubtopicIds' && body[key] !== undefined) data[key] = body[key];
  }
  return data;
}

const P = "forum:"; // prefix to isolate from other projects on the same Redis

export const keys = {
  forumConfig: () => `${P}config`,

  user: (id: string) => `${P}user:${id}`,
  userByUsername: (username: string) => `${P}user:by_username:${username.toLowerCase()}`,
  userByToken: (token: string) => `${P}user:by_token:${token}`,
  usersCounter: () => `${P}users:counter`,
  usersList: () => `${P}users:list`,
  usersOnline: () => `${P}users:online`,

  categoriesList: () => `${P}categories:list`,
  category: (id: string) => `${P}category:${id}`,
  categoryThreads: (id: string) => `${P}category:${id}:threads`,

  threadsCounter: () => `${P}threads:counter`,
  thread: (id: string) => `${P}thread:${id}`,
  threadViews: (id: string) => `${P}thread:${id}:views`,

  postsCounter: () => `${P}posts:counter`,
  threadPosts: (id: string) => `${P}thread:${id}:posts`,
  post: (id: string) => `${P}post:${id}`,

  modLog: () => `${P}mod:log`,
};

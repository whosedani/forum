export const keys = {
  forumConfig: () => "forum:config",

  user: (id: string) => `user:${id}`,
  userByUsername: (username: string) => `user:by_username:${username.toLowerCase()}`,
  userByToken: (token: string) => `user:by_token:${token}`,
  usersCounter: () => "users:counter",
  usersList: () => "users:list",
  usersOnline: () => "users:online",

  categoriesList: () => "categories:list",
  category: (id: string) => `category:${id}`,
  categoryThreads: (id: string) => `category:${id}:threads`,

  threadsCounter: () => "threads:counter",
  thread: (id: string) => `thread:${id}`,
  threadViews: (id: string) => `thread:${id}:views`,

  postsCounter: () => "posts:counter",
  threadPosts: (id: string) => `thread:${id}:posts`,
  post: (id: string) => `post:${id}`,

  modLog: () => "mod:log",
};

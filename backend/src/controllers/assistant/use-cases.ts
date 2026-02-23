import { PrismaFriendsRepository } from "../../repositories/prisma/prisma-friends-repository.js";
import { PrismaGroupsRepository } from "../../repositories/prisma/prisma-groups-repository.js";
import { PrismaMessagesRepository } from "../../repositories/prisma/prisma-messages-repository.js";
import { PrismaTodosRepository } from "../../repositories/prisma/prisma-todo-repository.js";
import { PrismaUsersRepository } from "../../repositories/prisma/prisma-users-repository.js";
import { ListAcceptedFriendsUseCase } from "../../use-cases/friends/list-accepted-friends.js";
import { CreateGroupUseCase } from "../../use-cases/groups/create.js";
import { DeleteGroupUseCase } from "../../use-cases/groups/delete.js";
import { LeaveGroupUseCase } from "../../use-cases/groups/leave.js";
import { ListGroupHistoryUseCase } from "../../use-cases/groups/list-history.js";
import { ListGroupsUseCase } from "../../use-cases/groups/list-groups.js";
import { UpdateGroupUseCase } from "../../use-cases/groups/update-group.js";
import { CreateGroupMessageUseCase } from "../../use-cases/messages/create-for-group.js";
import { CreateTodoMessageUseCase } from "../../use-cases/messages/create-for-todo.js";
import { DeleteTodoMessageUseCase } from "../../use-cases/messages/delete-for-todo.js";
import { ListGroupMessagesUseCase } from "../../use-cases/messages/list-by-group.js";
import { ListTodoMessagesUseCase } from "../../use-cases/messages/list-by-todo.js";
import { UpdateTodoMessageUseCase } from "../../use-cases/messages/update-for-todo.js";
import { CompleteTodoUseCase } from "../../use-cases/todo/complete-todo.js";
import { CreateTodoUseCase } from "../../use-cases/todo/create-todo.js";
import { DeleteTodoUseCase } from "../../use-cases/todo/delete-todo.js";
import { SelectTodosUseCase } from "../../use-cases/todo/select-todo.js";
import { UpdateTodoUseCase } from "../../use-cases/todo/update-todo.js";

const todosRepository = new PrismaTodosRepository();
const groupsRepository = new PrismaGroupsRepository();
const usersRepository = new PrismaUsersRepository();
const messagesRepository = new PrismaMessagesRepository();
const friendsRepository = new PrismaFriendsRepository();

// Singletons reutilizados pelo modulo da IA.
export const assistantUseCases = {
  createTodo: new CreateTodoUseCase(todosRepository, groupsRepository),
  selectTodos: new SelectTodosUseCase(todosRepository),
  completeTodo: new CompleteTodoUseCase(todosRepository),
  updateTodo: new UpdateTodoUseCase(todosRepository, groupsRepository),
  deleteTodo: new DeleteTodoUseCase(todosRepository, groupsRepository),

  createGroup: new CreateGroupUseCase(groupsRepository, usersRepository),
  listGroups: new ListGroupsUseCase(groupsRepository),
  updateGroup: new UpdateGroupUseCase(groupsRepository),
  deleteGroup: new DeleteGroupUseCase(groupsRepository),
  leaveGroup: new LeaveGroupUseCase(groupsRepository),
  listGroupHistory: new ListGroupHistoryUseCase(groupsRepository),

  listGroupMessages: new ListGroupMessagesUseCase(messagesRepository),
  createGroupMessage: new CreateGroupMessageUseCase(messagesRepository),
  listTodoMessages: new ListTodoMessagesUseCase(messagesRepository),
  createTodoMessage: new CreateTodoMessageUseCase(messagesRepository),
  updateTodoMessage: new UpdateTodoMessageUseCase(messagesRepository),
  deleteTodoMessage: new DeleteTodoMessageUseCase(messagesRepository),

  listAcceptedFriends: new ListAcceptedFriendsUseCase(friendsRepository),
};

export type AssistantUseCases = typeof assistantUseCases;

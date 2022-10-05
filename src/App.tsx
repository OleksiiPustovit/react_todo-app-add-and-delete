import React, {
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
} from 'react';
import { AuthContext } from './components/Auth/AuthContext';
import { Header } from './components/Header/Header';
import { TodoList } from './components/TodoList';
import { ErrorNotification } from './components/ErrorNotification';
import { Footer } from './components/Footer';
import { Todo } from './types/Todo';
import { FilterType } from './types/Filter';
import { getTodos, addTodo, deleteTodo } from './api/todos';
import { ErrorMessage } from './types/Error';

export const App: React.FC = () => {
  const [todos, setTodos] = React.useState<Todo[]>([]);
  const [errorMessage, setErrorMessage] = React.useState('');
  const [fileterType, setFilterType] = React.useState(FilterType.All);
  const [title, setTitle] = React.useState('');
  const [selectedId, setSelectedId] = React.useState<number[]>([]);
  const [isAdding, setisAdding] = React.useState(false);
  const user = React.useContext(AuthContext);

  useEffect(() => {
    const getTodosFromServer = async (userId: number) => {
      try {
        const receivedTodos = await getTodos(userId);

        setTodos(receivedTodos);
      } catch (error) {
        setErrorMessage(`${error}`);
      }
    };

    if (!user) {
      return;
    }

    getTodosFromServer(user.id);
  }, []);

  const filteredTodos = useMemo(() => {
    return todos.filter(todo => {
      switch (fileterType) {
        case FilterType.Active:
          return !todo.completed;
        case FilterType.Completed:
          return todo.completed;
        default:
          return true;
      }
    });
  }, [todos, fileterType]);

  const newTodo = useCallback(async (event: FormEvent) => {
    event.preventDefault();
    if (!title || !user) {
      setErrorMessage(ErrorMessage.ErrorTitle);

      return;
    }

    setisAdding(true);

    try {
      const postTodo = await addTodo(title, user.id);

      setTodos([...todos, postTodo]);
    } catch {
      setErrorMessage(ErrorMessage.NotAdd);
    }

    setisAdding(false);
    setTitle('');
  }, [title, user]);

  const removeTodo = useCallback(async (TodoId: number) => {
    setSelectedId([TodoId]);
    try {
      await deleteTodo(TodoId);

      setTodos([...todos.filter(({ id }) => id !== TodoId)]);
    } catch {
      setErrorMessage(ErrorMessage.NotDelete);
    }
  }, [todos, errorMessage]);

  const completedTodos = todos.filter(({ completed }) => completed);

  const deleteCompletedTodos = useCallback(() => {
    setSelectedId([...completedTodos].map(({ id }) => id));

    Promise.all(completedTodos.map(({ id }) => removeTodo(id)))
      .then(() => setTodos([...todos.filter(({ completed }) => !completed)]))
      .catch(() => {
        setErrorMessage(ErrorMessage.NotDelete);
        setSelectedId([]);
      });
  }, [todos, selectedId, errorMessage]);

  return (
    <div className="todoapp">
      <h1 className="todoapp__title">todos</h1>

      <div className="todoapp__content">
        <Header
          setTitle={setTitle}
          title={title}
          handleAddTodo={newTodo}
        />
        {todos.length > 0 && (
          <>
            <TodoList
              todos={filteredTodos}
              removeTodo={removeTodo}
              selectedId={selectedId}
              isAdding={isAdding}
              title={title}
            />
            <Footer
              filterType={fileterType}
              filterTypes={setFilterType}
              todos={todos}
              deleteCompleted={deleteCompletedTodos}
            />
          </>
        )}
      </div>
      {errorMessage && (
        <ErrorNotification
          errorMessage={errorMessage}
          setErrorMessage={setErrorMessage}
        />
      )}
    </div>
  );
};

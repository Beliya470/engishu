import { createContext, useContext, useState, useCallback, useRef } from 'react';
import TaskModal from '../components/TaskModal';

const TaskContext = createContext(null);

export function TaskProvider({ children }) {
  const [open, setOpen] = useState(false);
  const [prefill, setPrefill] = useState(null);
  const listenersRef = useRef([]);

  const openTaskModal = useCallback((prefillData) => {
    setPrefill(prefillData || null);
    setOpen(true);
  }, []);

  const closeTaskModal = useCallback(() => {
    setOpen(false);
    setPrefill(null);
  }, []);

  const onTaskCreated = useCallback(() => {
    listenersRef.current.forEach(fn => fn());
  }, []);

  const subscribeToTaskCreated = useCallback((fn) => {
    listenersRef.current.push(fn);
    return () => {
      listenersRef.current = listenersRef.current.filter(f => f !== fn);
    };
  }, []);

  return (
    <TaskContext.Provider value={{ openTaskModal, subscribeToTaskCreated }}>
      {children}
      <TaskModal open={open} onClose={closeTaskModal} onCreated={onTaskCreated} prefill={prefill} />
    </TaskContext.Provider>
  );
}

export const useTaskModal = () => useContext(TaskContext);

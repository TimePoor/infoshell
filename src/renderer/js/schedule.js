/**
 * #InfoHouse - 달력/일정/투두 모듈
 */

// 상태
let calendarDate = new Date();
let selectedDate = new Date();
let scheduleDates = new Set();

// DOM 요소
let calTitle, calDays, calPrev, calNext;
let scheduleList, scheduleInput, scheduleAddBtn, selectedDateTitle;
let todoList, todoInput, todoAddBtn;

/**
 * 초기화
 */
function initScheduleModule() {
  calTitle = document.getElementById('calTitle');
  calDays = document.getElementById('calDays');
  calPrev = document.getElementById('calPrev');
  calNext = document.getElementById('calNext');
  scheduleList = document.getElementById('scheduleList');
  scheduleInput = document.getElementById('scheduleInput');
  scheduleAddBtn = document.getElementById('scheduleAddBtn');
  selectedDateTitle = document.getElementById('selectedDateTitle');
  todoList = document.getElementById('todoList');
  todoInput = document.getElementById('todoInput');
  todoAddBtn = document.getElementById('todoAddBtn');

  // 이벤트 등록
  calPrev.addEventListener('click', () => {
    calendarDate.setMonth(calendarDate.getMonth() - 1);
    renderCalendar();
  });

  calNext.addEventListener('click', () => {
    calendarDate.setMonth(calendarDate.getMonth() + 1);
    renderCalendar();
  });

  scheduleAddBtn.addEventListener('click', addSchedule);
  scheduleInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addSchedule();
  });

  todoAddBtn.addEventListener('click', addTodo);
  todoInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addTodo();
  });
}

/**
 * 날짜를 키 문자열로 변환
 */
function formatDateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * 키 문자열을 날짜로 변환
 */
function parseDateKey(str) {
  const [y, m, d] = str.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/**
 * 년월 문자열
 */
function formatYearMonth(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

/**
 * 달력 렌더링
 */
async function renderCalendar() {
  const year = calendarDate.getFullYear();
  const month = calendarDate.getMonth();
  
  calTitle.textContent = `${year}년 ${month + 1}월`;
  
  // 일정 있는 날짜 조회
  const yearMonth = formatYearMonth(calendarDate);
  try {
    const result = await window.infohouse.getScheduleDates(yearMonth);
    scheduleDates = new Set(result.success ? result.data : []);
  } catch (e) {
    scheduleDates = new Set();
  }
  
  // 첫날과 마지막날
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDay = firstDay.getDay();
  const daysInMonth = lastDay.getDate();
  
  // 이전 달 날짜
  const prevLastDay = new Date(year, month, 0).getDate();
  
  let html = '';
  
  // 이전 달 날짜
  for (let i = startDay - 1; i >= 0; i--) {
    const day = prevLastDay - i;
    html += `<div class="calendar__day other-month">${day}</div>`;
  }
  
  // 이번 달 날짜
  const today = new Date();
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    const dateStr = formatDateKey(date);
    
    let classes = ['calendar__day'];
    
    // 오늘
    if (date.toDateString() === today.toDateString()) {
      classes.push('today');
    }
    
    // 선택된 날짜
    if (date.toDateString() === selectedDate.toDateString()) {
      classes.push('selected');
    }
    
    // 일요일/토요일
    if (date.getDay() === 0) classes.push('sunday');
    if (date.getDay() === 6) classes.push('saturday');
    
    // 일정 있음
    if (scheduleDates.has(dateStr)) {
      classes.push('has-schedule');
    }
    
    html += `<div class="${classes.join(' ')}" data-date="${dateStr}">${day}</div>`;
  }
  
  // 다음 달 날짜
  const totalCells = startDay + daysInMonth;
  const remaining = 7 - (totalCells % 7);
  if (remaining < 7) {
    for (let day = 1; day <= remaining; day++) {
      html += `<div class="calendar__day other-month">${day}</div>`;
    }
  }
  
  calDays.innerHTML = html;
  
  // 날짜 클릭 이벤트
  calDays.querySelectorAll('.calendar__day:not(.other-month)').forEach(el => {
    el.addEventListener('click', () => {
      const dateStr = el.dataset.date;
      selectedDate = parseDateKey(dateStr);
      renderCalendar();
      renderScheduleList();
    });
  });
}

/**
 * 일정 목록 렌더링
 */
async function renderScheduleList() {
  const dateStr = formatDateKey(selectedDate);
  const today = new Date();
  
  if (selectedDate.toDateString() === today.toDateString()) {
    selectedDateTitle.textContent = '오늘의 일정';
  } else {
    const m = selectedDate.getMonth() + 1;
    const d = selectedDate.getDate();
    selectedDateTitle.textContent = `${m}월 ${d}일 일정`;
  }
  
  let list = [];
  try {
    const result = await window.infohouse.getSchedulesByDate(dateStr);
    if (result.success) list = result.data;
  } catch (e) {}
  
  if (list.length === 0) {
    scheduleList.innerHTML = '<div class="schedule-empty">일정이 없습니다</div>';
    return;
  }
  
  scheduleList.innerHTML = list.map(item => `
    <div class="schedule-item">
      <span class="schedule-item__text">${item.text}</span>
      <button class="schedule-item__delete" data-id="${item.id}">
        <i class="fa-solid fa-trash"></i>
      </button>
    </div>
  `).join('');
  
  // 삭제 버튼
  scheduleList.querySelectorAll('.schedule-item__delete').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = parseInt(btn.dataset.id);
      await window.infohouse.deleteSchedule(id);
      renderCalendar();
      renderScheduleList();
    });
  });
}

/**
 * 일정 추가
 */
async function addSchedule() {
  const text = scheduleInput.value.trim();
  if (!text) return;
  
  const dateStr = formatDateKey(selectedDate);
  await window.infohouse.addSchedule(dateStr, text);
  
  scheduleInput.value = '';
  renderCalendar();
  renderScheduleList();
}

/**
 * 투두 목록 렌더링
 */
async function renderTodoList() {
  let todos = [];
  try {
    const result = await window.infohouse.getTodos();
    if (result.success) todos = result.data;
  } catch (e) {}
  
  if (todos.length === 0) {
    todoList.innerHTML = '<div class="todo-empty">할 일이 없습니다</div>';
    return;
  }
  
  todoList.innerHTML = todos.map(item => `
    <div class="todo-item ${item.done ? 'completed' : ''}">
      <div class="todo-item__checkbox ${item.done ? 'checked' : ''}" data-id="${item.id}" data-done="${item.done}">
        ${item.done ? '<i class="fa-solid fa-check"></i>' : ''}
      </div>
      <span class="todo-item__text">${item.text}</span>
      <button class="todo-item__delete" data-id="${item.id}">
        <i class="fa-solid fa-trash"></i>
      </button>
    </div>
  `).join('');
  
  // 체크박스
  todoList.querySelectorAll('.todo-item__checkbox').forEach(cb => {
    cb.addEventListener('click', async () => {
      const id = parseInt(cb.dataset.id);
      const done = cb.dataset.done === '1';
      await window.infohouse.toggleTodo(id, !done);
      renderTodoList();
    });
  });
  
  // 삭제 버튼
  todoList.querySelectorAll('.todo-item__delete').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = parseInt(btn.dataset.id);
      await window.infohouse.deleteTodo(id);
      renderTodoList();
    });
  });
}

/**
 * 투두 추가
 */
async function addTodo() {
  const text = todoInput.value.trim();
  if (!text) return;
  
  await window.infohouse.addTodo(text);
  todoInput.value = '';
  renderTodoList();
}

// 전역 노출
window.ScheduleModule = {
  init: initScheduleModule,
  renderCalendar,
  renderScheduleList,
  renderTodoList
};

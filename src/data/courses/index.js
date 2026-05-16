import { cybersecurityCourse } from './cybersecurity';
import { mobileDevCourse } from './mobileDev';
import { physicsCourse } from './physics';
import { philosophyCourse } from './philosophy';

export const coursesData = [
  cybersecurityCourse,
  mobileDevCourse,
  physicsCourse,
  philosophyCourse,
];

export const getCourseByDomain = (domain) => {
  return coursesData.find(course => course.domain.toLowerCase() === domain.toLowerCase()) || 
         coursesData.find(course => course.title.toLowerCase() === domain.toLowerCase());
};

export const getCourseById = (id) => {
  return coursesData.find(course => course.id === id);
};

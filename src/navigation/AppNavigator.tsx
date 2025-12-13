import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import DashboardScreen from '../screens/DashboardScreen';
import MisMateriasScreen from '../screens/MisMateriasScreen';
import ListaAlumnosScreen from '../screens/ListaAlumnosScreen';
import GuestScreen from '../screens/GuestScreen';
import CalificarScreen from '../screens/CalificarScreen';
import ProfileScreen from '../screens/ProfileScreen';
import DepartmentScreen from '../screens/DepartmentScreen';
import OwnerScreen from '../screens/OwnerScreen';
import CalificacionesScreen from '../screens/CalificacionesScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import VerifyCodeScreen from '../screens/VerifyCodeScreen';
import ResetPasswordScreen from '../screens/ResetPasswordScreen';
import AddStaffScreen from '../screens/AddStaffScreen';
import StaffListScreen from '../screens/StaffListScreen';
import SubjectsListScreen from '../screens/SubjectsListScreen';
import AddSubjectScreen from '../screens/AddSubjectScreen';
import SubjectDetailScreen from '../screens/SubjectDetailScreen';
import AssignTeacherScreen from '../screens/AssignTeacherScreen';
import AssignmentHistoryScreen from '../screens/AssignmentHistoryScreen';
import StudentsListScreen from '../screens/StudentsListScreen';
import AddStudentScreen from '../screens/AddStudentScreen';
import MateriaDetailScreen from '../screens/MateriaDetailScreen';

import StudentDetailScreen from '../screens/StudentDetailScreen';
import CalendarConfigScreen from '../screens/CalendarConfigScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import SettingsScreen from '../screens/SettingsScreen';

import GradingScreen from '../screens/GradingScreen';
import StudentGradesScreen from '../screens/StudentGradesScreen';
import GradeViewerScreen from '../screens/GradeViewerScreen';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
    return (
        <NavigationContainer>
            <Stack.Navigator initialRouteName="Login" screenOptions={{ headerShown: false }}>
                <Stack.Screen name="Login" component={LoginScreen} />
                <Stack.Screen name="Register" component={RegisterScreen} />
                <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
                <Stack.Screen name="VerifyCode" component={VerifyCodeScreen} />
                <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
                <Stack.Screen name="Dashboard" component={DashboardScreen} />
                <Stack.Screen name="MisMaterias" component={MisMateriasScreen} />
                <Stack.Screen name="MateriaDetail" component={MateriaDetailScreen} />
                <Stack.Screen name="ListaAlumnos" component={ListaAlumnosScreen} />
                <Stack.Screen name="Calificar" component={CalificarScreen} />
                <Stack.Screen name="Grading" component={GradingScreen} />
                <Stack.Screen name="Profile" component={ProfileScreen} />
                <Stack.Screen name="Department" component={DepartmentScreen} />
                <Stack.Screen name="Owner" component={OwnerScreen} />
                <Stack.Screen name="Calificaciones" component={CalificacionesScreen} />
                <Stack.Screen name="Guest" component={GuestScreen} />
                <Stack.Screen name="AddStaff" component={AddStaffScreen} />
                <Stack.Screen name="StaffList" component={StaffListScreen} />
                <Stack.Screen name="SubjectsList" component={SubjectsListScreen} />
                <Stack.Screen name="AddSubject" component={AddSubjectScreen} />
                <Stack.Screen name="SubjectDetail" component={SubjectDetailScreen} />
                <Stack.Screen name="AssignTeacher" component={AssignTeacherScreen} />
                <Stack.Screen name="AssignmentHistory" component={AssignmentHistoryScreen} />
                <Stack.Screen name="StudentsList" component={StudentsListScreen} />
                <Stack.Screen name="AddStudent" component={AddStudentScreen} />
                <Stack.Screen name="StudentDetail" component={StudentDetailScreen} />
                <Stack.Screen name="CalendarConfig" component={CalendarConfigScreen} />
                <Stack.Screen name="Notifications" component={NotificationsScreen} />
                <Stack.Screen name="Settings" component={SettingsScreen} />
                <Stack.Screen name="StudentGrades" component={StudentGradesScreen} />
                <Stack.Screen name="GradeViewer" component={GradeViewerScreen} />
            </Stack.Navigator>
        </NavigationContainer>
    );
}

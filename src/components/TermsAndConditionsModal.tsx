import React from 'react';
import { View, Text, Modal, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { spacing, borderRadius, shadows } from '../theme/spacing';
import { textStyles } from '../theme/typography';

interface TermsAndConditionsModalProps {
    visible: boolean;
    onClose: () => void;
}

export default function TermsAndConditionsModal({ visible, onClose }: TermsAndConditionsModalProps) {
    return (
        <Modal visible={visible} animationType="slide" transparent={true}>
            <View style={styles.modalOverlay}>
                <View style={styles.modalContainer}>
                    <View style={styles.header}>
                        <Text style={styles.title}>Términos y Condiciones</Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <Ionicons name="close" size={24} color={colors.text} />
                        </TouchableOpacity>
                    </View>
                    
                    <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
                        <Text style={styles.text}>
                            {/* Content from TyC.txt */}
                            Términos y Condiciones de EscuelApp{'\n\n'}
                            Fecha de última actualización: 30/11/2025{'\n'}
                            Nombre de la Aplicación: EscuelApp (en adelante, “la App”, “EscuelApp”, “Proveedor” o “Titular”){'\n\n'}
                            
                            Advertencia legal: este documento es una propuesta contractualmente completa y detallada. No sustituye la asesoría jurídica profesional; se aconseja revisión y adaptación por un abogado con competencia en derecho tecnológico y protección de datos en Argentina.{'\n\n'}

                            1. Partes, aceptación y alcance{'\n\n'}
                            1.1. Estos Términos y Condiciones (“T&C”) regulan la utilización de EscuelApp por parte de las instituciones educativas clientes (“Institución”) y de sus usuarios autorizados: personal jerárquico, docentes, preceptores y padres/tutores (“Usuarios” o “Titulares de Datos”).{'\n'}
                            1.2. El acceso, registro o uso de la App constituye aceptación expresa, íntegra y sin reservas de estos T&C. Si el Usuario no los acepta, deberá abstenerse de usar la App.{'\n\n'}

                            2. Marco normativo aplicable{'\n\n'}
                            2.1. El tratamiento de datos personales efectuado por EscuelApp se realiza en el marco de la Ley N° 25.326 de Protección de los Datos Personales y su reglamentación, y de las normas y decisiones administrativas y/o reglamentarias que la complementen.{'\n'}
                            2.2. La autoridad de aplicación y control para la protección de datos personales en el ámbito nacional es la Agencia de Acceso a la Información Pública (AAIP), organismo donde pueden presentarse consultas o denuncias por incumplimientos.{'\n\n'}

                            3. Funcionalidad y destinatarios{'\n\n'}
                            3.1. Descripción: EscuelApp provee gestión interna escolar (boletines, asistencia, notificaciones, seguimiento académico y conducta, almacenamiento documental, estadísticas, informes, entre otras funciones).{'\n'}
                            3.2. Destinatarios: la App está dirigida exclusivamente a uso institucional interno y a los Usuarios autorizados por la Institución. La Institución es responsable de la creación, asignación y revocación de cuentas y permisos.{'\n\n'}

                            4. Registro, cuentas y responsabilidades de la Institución{'\n\n'}
                            4.1. Cada cuenta es personal e intransferible. La Institución garantiza la veracidad de los datos facilitados y la autorización de las personas registradas.{'\n'}
                            4.2. La Institución es responsable de: (i) verificar el consentimiento de los representantes legales cuando proceda; (ii) notificar inmediatamente al Proveedor sobre la revocación de autorizaciones o incidentes; (iii) custodiar credenciales y políticas de acceso.{'\n\n'}

                            5. Principios aplicables al tratamiento{'\n\n'}
                            5.1. Se aplican los principios de la Ley 25.326: finalidad, proporcionalidad (minimización), calidad de datos, consentimiento y seguridad. El tratamiento se limitará a datos estrictamente necesarios para los fines institucionales contratados.{'\n\n'}

                            6. Categorías de datos y finalidad{'\n\n'}
                            6.1. Datos de registro y contacto (nombre, DNI, correo, teléfono, relación con la Institución).{'\n'}
                            6.2. Datos académicos y administrativos (calificaciones, materias, asistencia, observaciones de conducta, informes).{'\n'}
                            6.3. Datos técnicos y de uso (identificadores de dispositivo, IP, logs, metadata).{'\n'}
                            6.4. Datos sensibles: EscuelApp no solicita ni procesa datos “sensibles” salvo que exista una base legal expresa o autorización del titular/representante legal.{'\n\n'}

                            7. Base legal del tratamiento y consentimiento{'\n\n'}
                            7.1. La base legal principal es el consentimiento informado del titular o representante, y/o la relación contractual/organizativa entre la Institución y el Usuario cuando corresponda.{'\n'}
                            7.2. Para menores, ver sección específica (Datos de menores y consentimiento parental).{'\n\n'}

                            8. Derechos de los titulares (ARCO) y procedimiento{'\n\n'}
                            8.1. Derechos: acceso, rectificación, actualización, supresión, oposición y revocación del consentimiento en los términos de la Ley N° 25.326.{'\n'}
                            8.2. Procedimiento para ejercer derechos ARCO: Presentación escrita al canal de soporte, acreditación de identidad, respuesta en plazos legales.{'\n\n'}

                            9. Retención, conservación y eliminación de datos{'\n\n'}
                            9.1. Política general: Los datos se conservarán únicamente durante el tiempo necesario para cumplir la finalidad contractual o legal.{'\n'}
                            9.2. Retenciones sugeridas: Registros académicos (10 años), Asistencia (5 años), Financieros (7 años).{'\n'}
                            9.3. Eliminación: al solicitar supresión, los datos serán borrados o anonimizados salvo obligación legal.{'\n\n'}

                            10. Medidas de seguridad técnicas y organizativas{'\n\n'}
                            10.1. Principios: confidencialidad, integridad y disponibilidad. Medidas: Control de acceso, Autenticación segura, Cifrado, Backups, Evaluaciones periódicas.{'\n'}
                            10.2. Limitaciones: el Proveedor no garantiza eliminación absoluta de riesgo.{'\n\n'}

                            11. Gestión de proveedores y encargados de tratamiento{'\n\n'}
                            11.1. El Proveedor podrá contratar servicios de terceros con contratos que garanticen seguridad equivalente.{'\n\n'}

                            12. Transferencias internacionales de datos{'\n\n'}
                            12.1. Se realizarán con garantías adecuadas o consentimiento expreso.{'\n\n'}

                            13. Incidentes de seguridad{'\n\n'}
                            13.1. Se notificará a la AAIP y a los titulares en caso de riesgo para derechos y libertades.{'\n\n'}

                            14. Auditoría y cumplimiento{'\n\n'}
                            14.1. Auditorías razonables acordadas entre partes.{'\n\n'}

                            15. Datos de menores{'\n\n'}
                            15.1. Requiere consentimiento de representante legal para menores de 16 años.{'\n\n'}

                            16. Anonimización{'\n\n'}
                            16.1. Uso de datos anonimizados para estadísticas y mejoras.{'\n\n'}

                            17. Publicidad{'\n\n'}
                            17.1. La versión gratuita puede mostrar publicidad. Los datos no serán vendidos.{'\n\n'}

                            18. Propiedad intelectual{'\n\n'}
                            18.1. El software es propiedad del Titular.{'\n\n'}

                            19. Garantías y responsabilidad{'\n\n'}
                            19.1. Servicio “tal cual”. Responsabilidad limitada al monto abonado en últimos 12 meses.{'\n\n'}

                            20. Fuerza mayor{'\n\n'}
                            20.1. Exención de responsabilidad por causas ajenas.{'\n\n'}

                            21. Modificaciones{'\n\n'}
                            21.1. Modificaciones con previo aviso. Uso continuado implica aceptación.{'\n\n'}

                            22. Comunicaciones{'\n\n'}
                            22.1. Canal oficial: soporte@escuelapp.example{'\n\n'}

                            23. Legislación y jurisdicción{'\n\n'}
                            23.1. Leyes de la República Argentina. Tribunales competentes.{'\n'}
                        </Text>
                    </ScrollView>
                    
                    <View style={styles.footer}>
                        <TouchableOpacity style={styles.acceptButton} onPress={onClose}>
                            <Text style={styles.acceptButtonText}>Entendido</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContainer: {
        width: '90%',
        height: '80%',
        backgroundColor: colors.bgWhite,
        borderRadius: borderRadius.lg,
        ...shadows.lg,
        overflow: 'hidden',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    title: {
        ...textStyles.h3,
        color: colors.text,
    },
    closeButton: {
        padding: spacing.xs,
    },
    content: {
        flex: 1,
    },
    contentContainer: {
        padding: spacing.md,
    },
    text: {
        ...textStyles.body,
        color: colors.text,
        fontSize: 14,
    },
    footer: {
        padding: spacing.md,
        borderTopWidth: 1,
        borderTopColor: colors.border,
        alignItems: 'center',
    },
    acceptButton: {
        backgroundColor: colors.primary,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.xl,
        borderRadius: borderRadius.md,
    },
    acceptButtonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
});

import { View,Text,Pressable } from "react-native";
export default function Home(){return <View style={{flex:1,padding:24,gap:16}}><Text style={{fontSize:28,fontWeight:"700"}}>Securia360</Text><Text>Selecciona una organización para consultar tareas y capturar evidencia sin conexión.</Text><Pressable accessibilityRole="button"><Text>Seleccionar organización</Text></Pressable></View>}

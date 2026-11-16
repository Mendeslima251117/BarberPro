import 'react-native-url-polyfill/auto';
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  StyleSheet,
  SafeAreaView,
  Alert,
  Platform
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://rusxnqbxmdgudvmodphf.supabase.co';
const SUPABASE_KEY = 'sb_publishable_6ffk-lG6fRWHC-VWL-FEbg_DGEYC0av';

const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_KEY,
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false
    }
  }
);

const shops = [
  { id: 1, name: 'Barbearia Imperial', city: 'Campinas - SP', rating: '4.9', price: 45 },
  { id: 2, name: 'Black Gold Barber', city: 'Hortolândia - SP', rating: '4.8', price: 50 },
  { id: 3, name: 'Studio Navalha', city: 'Monte Mor - SP', rating: '5.0', price: 40 }
];


/*const services = [
  { name: 'Corte masculino', price: 45, duration: '40 min' },
  { name: 'Barba', price: 30, duration: '30 min' },
  { name: 'Corte + Barba', price: 65, duration: '60 min' }
];*/

const barbers = [
  { name: 'Rafael Souza', specialty: 'Degradê e cortes modernos' },
  { name: 'Lucas Martins', specialty: 'Cortes clássicos e barba' }
];

const hours = ['09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00'];

export default function App() {
  const [page, setPage] = useState('home');
  const [shops, setShops] = useState([]);
  const [myShops, setMyShops] = useState([]);
const [myShopsLoading, setMyShopsLoading] = useState(false);
  const [shopsLoading, setShopsLoading] = useState(false);
  const [shop, setShop] = useState(null);
  const [service, setService] = useState(null);
  const [services, setServices] = useState([]);
const [servicesLoading, setServicesLoading] = useState(false);
// CADASTRO DE SERVIÇOS
const [newService, setNewService] = useState({
  name: '',
  price: '',
  duration: '40'
});

const [serviceSaving, setServiceSaving] = useState(false);
  const [barber, setBarber] = useState(null);
  const [barbers, setBarbers] = useState([]);
const [barbersLoading, setBarbersLoading] = useState(false);
// CONVITE DE BARBEIROS
const [inviteBarberName, setInviteBarberName] = useState('');
const [invitationLink, setInvitationLink] = useState('');
const [inviteBarberEmail, setInviteBarberEmail] = useState('');
const [inviteBarberLoading, setInviteBarberLoading] = useState(false);
  const [hour, setHour] = useState(null);
  const [appointmentDate, setAppointmentDate] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [appointments, setAppointments] = useState([]);
  const [manageAppointments, setManageAppointments] = useState([]);
const [manageAppointmentsLoading, setManageAppointmentsLoading] = useState(false);
const [name, setName] = useState('');
const [session, setSession] = useState(null);
const [authMode, setAuthMode] = useState('login');
const [isRecoveryMode, setIsRecoveryMode] = useState(false);
const [newPassword, setNewPassword] = useState('');
const [loading, setLoading] = useState(false);
// PERFIL DO CLIENTE
const [profile, setProfile] = useState({
  full_name: '',
  phone: '',
  avatar_url: ''
});

const [profileLoading, setProfileLoading] = useState(false);
// BUSCAR PERFIL DO CLIENTE
// CADASTRO DA BARBEARIA
const [shopLoading, setShopLoading] = useState(false);

const [newShop, setNewShop] = useState({
  name: '',
  description: '',
  city: '',
  address: ''
});
async function loadProfile(userId) {
  try {
    setProfileLoading(true);

    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, phone, avatar_url')
      .eq('id', userId)
      .single();

    if (error) throw error;

    setProfile({
      full_name: data.full_name || '',
      phone: data.phone || '',
      avatar_url: data.avatar_url || ''
    });

  } catch (error) {
    console.log('Erro ao carregar perfil:', error.message);
  } finally {
    setProfileLoading(false);
  }
}
// BUSCAR BARBEARIAS CADASTRADAS

async function loadShops() {
  try {
    setShopsLoading(true);

    // Catálogo público: todas as barbearias ativas
    const { data, error } = await supabase
      .from('barbershops')
      .select('id, name, city, description, address, active, services(price_cents, active)')
      .eq('active', true)
      .order('created_at', { ascending: false });

    if (error) throw error;

    setShops(data || []);

  } catch (error) {
    console.log('Erro ao carregar barbearias:', error.message);
    Alert.alert('Erro', 'Não foi possível carregar as barbearias.');
  } finally {
    setShopsLoading(false);
  }
}

// BUSCAR MINHAS BARBEARIAS (PROPRIETÁRIO E EQUIPE)
async function loadMyShops() {
  if (!session?.user?.id) {
    setMyShops([]);
    return;
  }

  try {
    setMyShopsLoading(true);

    // Buscar barbearias próprias
    const { data: ownedShops, error: ownerError } = await supabase
      .from('barbershops')
      .select('id, name, city, description, address, active')
      .eq('owner_id', session.user.id)
      .order('created_at', { ascending: false });

    if (ownerError) throw ownerError;

    // Buscar vínculos com a equipe
    const { data: memberships, error: memberError } = await supabase
      .from('barbershop_members')
      .select('shop_id, member_role')
      .eq('user_id', session.user.id);

    if (memberError) throw memberError;

    const shopIds = (memberships || []).map(item => item.shop_id);

    let memberShops = [];

    if (shopIds.length > 0) {
      const { data, error } = await supabase
        .from('barbershops')
        .select('id, name, city, description, address, active')
        .in('id', shopIds)
        .order('created_at', { ascending: false });

      if (error) throw error;

      memberShops = data || [];
    }

    // Unir as listas sem duplicar registros
    // Unir as listas sem duplicar registros
const allShops = [
  ...(ownedShops || []).map(item => ({
    ...item,
    member_role: 'owner'
  })),
  ...memberShops.map(item => ({
    ...item,
    member_role:
      memberships.find(m => m.shop_id === item.id)?.member_role || 'barber'
  }))
];

const uniqueShops = Array.from(
  new Map(allShops.map(item => [item.id, item])).values()
);

    setMyShops(uniqueShops);

  } catch (error) {
    console.log('Erro ao carregar minhas barbearias:', error.message);
    Alert.alert('Erro', 'Não foi possível carregar suas barbearias.');
  } finally {
    setMyShopsLoading(false);
  }
}

// BUSCAR SERVIÇOS DA BARBEARIA
async function loadServices(shopId) {
  try {
    setServicesLoading(true);

    const { data, error } = await supabase
      .from('services')
      .select('*')
      .eq('shop_id', shopId)
      .eq('active', true)
      .order('name');

    if (error) throw error;

    setServices(data || []);

  } catch (error) {
    Alert.alert('Erro', error.message);
  } finally {
    setServicesLoading(false);
  }
}

// BUSCAR BARBEIROS DA BARBEARIA
async function loadBarbers(shopId) {
  try {
    setBarbersLoading(true);

    // 1. Buscar os barbeiros da barbearia
    const { data: barberData, error: barberError } = await supabase
      .from('barber_profiles')
      .select('id, shop_id, user_id, bio, specialties, photo_url, active')
      .eq('shop_id', shopId)
      .eq('active', true);

    if (barberError) throw barberError;

    // 2. Buscar os perfis dos usuários
    const userIds = (barberData || []).map(item => item.user_id);

    let profilesData = [];

    if (userIds.length > 0) {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, phone, avatar_url')
        .in('id', userIds);

      if (error) throw error;

      profilesData = data || [];
    }

    // 3. Relacionar os dados pelo ID do usuário
    const formattedBarbers = (barberData || []).map(item => {
      const userProfile = profilesData.find(
        profile => profile.id === item.user_id
      );

      return {
        id: item.id,
        shop_id: item.shop_id,
        user_id: item.user_id,
        name: userProfile?.full_name || 'Barbeiro',
        phone: userProfile?.phone || '',
        specialty: (item.specialties || []).join(', '),
        bio: item.bio || '',
        photo_url: item.photo_url || userProfile?.avatar_url || ''
      };
    });

    setBarbers(formattedBarbers);

  } catch (error) {
    console.log('Erro ao carregar barbeiros:', error.message);
    Alert.alert('Erro', 'Não foi possível carregar os barbeiros.');
  } finally {
    setBarbersLoading(false);
  }
}



async function handleInviteBarber() {
  if (!shop?.id) {
    Alert.alert('Atenção', 'Selecione uma barbearia.');
    return;
  }

  const fullName = inviteBarberName.trim();
  const barberEmail = inviteBarberEmail.trim().toLowerCase();

  if (!fullName || !barberEmail) {
    Alert.alert('Atenção', 'Informe o nome e o e-mail do barbeiro.');
    return;
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(barberEmail)) {
  Alert.alert('Atenção', 'Informe um e-mail válido.');
  return;
}

  try {
    setInviteBarberLoading(true);
    setInvitationLink('');

    const { data, error } = await supabase.functions.invoke(
      'invite-barber',
      {
        body: {
          shop_id: shop.id,
          full_name: fullName,
          email: barberEmail
        }
      }
    );

    if (error) throw error;
    if (data?.error) throw new Error(data.error);

    setInvitationLink(data?.invitation_link || '');

    if (data?.invitation_generated && data?.invitation_link) {
      Alert.alert(
        'Convite gerado',
        'O cadastro foi associado à barbearia. O link de convite está disponível abaixo do formulário.'
      );
    } else {
      Alert.alert('Sucesso', data.message);
    }

    setInviteBarberName('');
    setInviteBarberEmail('');

    await loadBarbers(shop.id);

  } catch (error) {
    console.log('Erro ao convidar barbeiro:', error);
    Alert.alert('Erro ao convidar', error.message);
  } finally {
    setInviteBarberLoading(false);
  }
}


// CADASTRAR SERVIÇO
async function handleCreateService() {
  if (!shop?.id) {
    Alert.alert('Atenção', 'Selecione uma barbearia.');
    return;
  }

  if (!newService.name.trim() || !newService.price.trim()) {
    Alert.alert('Atenção', 'Informe o nome e o preço do serviço.');
    return;
  }

  const price = Number(
    newService.price.replace(',', '.')
  );

  const duration = Number(newService.duration);

  if (!Number.isFinite(price) || price <= 0) {
    Alert.alert('Atenção', 'Informe um preço válido.');
    return;
  }

  if (!Number.isInteger(duration) || duration <= 0) {
    Alert.alert('Atenção', 'Informe uma duração válida.');
    return;
  }

  try {
    setServiceSaving(true);

    const { error } = await supabase
      .from('services')
      .insert({
        shop_id: shop.id,
        name: newService.name.trim(),
        description: newService.description?.trim() || '',
        duration_minutes: duration,
        price_cents: Math.round(price * 100),
        active: true
      });

    if (error) throw error;

    if (typeof window !== 'undefined') {
  window.alert('Serviço cadastrado com sucesso!');
} else {
  Alert.alert('Sucesso', 'Serviço cadastrado!');
}

    setNewService({
      name: '',
      description: '',
      price: '',
      duration: '40'
    });

    await loadServices(shop.id);

  } catch (error) {
    Alert.alert('Erro ao cadastrar serviço', error.message);
  } finally {
    setServiceSaving(false);
  }
}
// SALVAR PERFIL DO CLIENTE
async function saveProfile() {
  if (!session?.user?.id) {
    Alert.alert('Atenção', 'Faça login novamente.');
    return;
  }

  if (!profile.full_name.trim()) {
    Alert.alert('Atenção', 'Informe seu nome completo.');
    return;
  }

  try {
    setProfileLoading(true);

    const { data, error } = await supabase
      .from('profiles')
      .update({
        full_name: profile.full_name.trim(),
        phone: profile.phone.trim(),
        updated_at: new Date().toISOString()
      })
      .eq('id', session.user.id)
      .select()
      .single();

    if (error) throw error;

    setProfile({
      full_name: data.full_name || '',
      phone: data.phone || '',
      avatar_url: data.avatar_url || ''
    });

    Alert.alert('Sucesso', 'Perfil atualizado!');

    setPage('home');

  } catch (error) {
    Alert.alert('Erro', error.message);
  } finally {
    setProfileLoading(false);
  }
}


 


useEffect(() => {
  let mounted = true;

  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((event, newSession) => {
    if (!mounted) return;

    setSession(newSession);

    if (event === 'PASSWORD_RECOVERY') {
      setIsRecoveryMode(true);
      setAuthMode('login');
      setPage('login');
    }
  });

  
async function processRecoveryLink() {
  if (Platform.OS !== 'web') return;

  try {
    const url = new URL(window.location.href);

    const queryParams = url.searchParams;
    const hashParams = new URLSearchParams(
      url.hash.replace(/^#/, '')
    );

    const code = queryParams.get('code');
    const accessToken = hashParams.get('access_token');
    const refreshToken = hashParams.get('refresh_token');

    const recoveryType =
      queryParams.get('type') === 'recovery' ||
      hashParams.get('type') === 'recovery' ||
      queryParams.get('flow') === 'recovery';

    const authError =
      queryParams.get('error') ||
      hashParams.get('error');

    const errorCode =
      queryParams.get('error_code') ||
      hashParams.get('error_code');

    if (authError || errorCode) {
      console.log('Erro no link:', authError, errorCode);

      window.alert(
        errorCode === 'otp_expired'
          ? 'Este link expirou ou já foi utilizado. Solicite uma nova recuperação.'
          : 'Não foi possível validar o link. Solicite uma nova recuperação.'
      );

      window.history.replaceState(
        {},
        document.title,
        window.location.pathname
      );
      return;
    }

    if (!recoveryType || (!code && !(accessToken && refreshToken))) {
      return;
    }

    let result;

    if (code) {
      result = await supabase.auth.exchangeCodeForSession(code);
    } else {
      result = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });
    }

    if (!mounted) return;

    if (result.error || !result.data.session) {
      console.log(
        'Erro ao validar recuperação:',
        result.error?.message
      );

      window.alert(
        'Não foi possível validar sua recuperação. Solicite um novo link.'
      );
      return;
    }

    setSession(result.data.session);
    setIsRecoveryMode(true);
    setAuthMode('login');
    setPage('login');
    setNewPassword('');

    window.history.replaceState(
      {},
      document.title,
      window.location.pathname
    );

    console.log('Link de recuperação validado com sucesso.');
  } catch (error) {
    console.log(
      'Erro no processamento do link:',
      error.message
    );
  }
}


  processRecoveryLink();

  return () => {
    mounted = false;
    subscription.unsubscribe();
  };
}, []);




  useEffect(() => {
  loadShops();
  loadMyShops();

  if (session?.user?.id) {
    loadProfile(session.user.id);
  } else {
    setProfile({
      full_name: '',
      phone: '',
      avatar_url: ''
    });
  }
}, [session?.user?.id]);

  // CADASTRO
  async function handleSignUp() {
    if (!name.trim() || !email.trim() || password.length < 6) {
      Alert.alert('Atenção', 'Preencha os campos corretamente.');
      return;
    }

    try {
      setLoading(true);

      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: name.trim(),
            role: 'customer'
          },
          emailRedirectTo:
            'https://snack.expo.dev/@willianmendes/jealous-indigo-pretzel'
        }
      });

      if (error) throw error;

      if (data.session) {
        setSession(data.session);
        setPage('home');
      } else {
        Alert.alert(
          'Cadastro realizado',
          'Confira seu e-mail para confirmar a conta.'
        );
        setAuthMode('login');
      }
    } catch (error) {
      Alert.alert('Erro no cadastro', error.message);
    } finally {
      setLoading(false);
    }
  }

  // LOGIN
  async function handleSignIn() {
    if (!email.trim() || !password) {
      Alert.alert('Atenção', 'Informe e-mail e senha.');
      return;
    }

    try {
      setLoading(true);

      const { data, error } =
        await supabase.auth.signInWithPassword({
          email: email.trim(),
          password
        });

      if (error) throw error;

      setSession(data.session);
      setPage('home');

    } catch (error) {
      Alert.alert('Falha no login', error.message);
    } finally {
      setLoading(false);
    }
  }

// RECUPERAR SENHA



async function handlePasswordReset() {
  const recoveryEmail = email.trim().toLowerCase();

  if (!recoveryEmail) {
    if (Platform.OS === 'web') {
      window.alert('Digite seu e-mail primeiro.');
    } else {
      Alert.alert('Atenção', 'Digite seu e-mail primeiro.');
    }
    return;
  }

  try {
    setLoading(true);

    let redirectUrl;

if (Platform.OS === 'web') {
  redirectUrl = 'https://snack.expo.dev/@willianmendes/jealous-indigo-pretzel?platform=web&flow=recovery';
} else {
  redirectUrl = 'barberpro://auth/callback?flow=recovery';
}

    const { error } = await supabase.auth.resetPasswordForEmail(
      recoveryEmail,
      {
        redirectTo: redirectUrl,
      }
    );

    if (error) {
      throw error;
    }

    if (Platform.OS === 'web') {
      window.alert(
        'Solicitação enviada! Abra o e-mail mais recente e clique uma única vez em Redefinir senha.'
      );
    } else {
      Alert.alert(
        'E-mail enviado',
        'Abra o e-mail mais recente e clique uma única vez em Redefinir senha.'
      );
    }
  } catch (error) {
    console.log('Erro na recuperação:', error.message);

    if (Platform.OS === 'web') {
      window.alert('Erro ao enviar: ' + error.message);
    } else {
      Alert.alert('Erro', error.message);
    }
  } finally {
    setLoading(false);
  }
}



  // SALVAR NOVA SENHA
  async function handleUpdatePassword() {
    if (newPassword.trim().length < 6) {
      Alert.alert('Atenção', 'A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    try {
      setLoading(true);

      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      setIsRecoveryMode(false);
      setNewPassword('');
      setPassword('');

      Alert.alert('Sucesso', 'Sua senha foi alterada. Faça login novamente.');
      await supabase.auth.signOut();
      setSession(null);
      setAuthMode('login');

    } catch (error) {
      Alert.alert('Erro', error.message);
    } finally {
      setLoading(false);
    }
  }

  // LOGOUT
  async function handleSignOut() {
    const { error } = await supabase.auth.signOut();

    if (error) {
      Alert.alert('Erro', error.message);
      return;
    }

    setSession(null);
    setPage('home');
  }




  const gold = '#D5AD65';

  async function confirmBooking() {
  if (!appointmentDate || !hour) {
    Alert.alert(
      'Atenção',
      'Selecione a data e o horário do atendimento.'
    );
    return;
  }

  if (!session?.user?.id || !shop?.id || !barber?.id || !service?.id) {
    Alert.alert(
      'Atenção',
      'Não foi possível identificar todos os dados do agendamento.'
    );
    return;
  }

  const selectedDate = new Date(`${appointmentDate}T${hour}:00`);

  if (
    Number.isNaN(selectedDate.getTime()) ||
    selectedDate <= new Date()
  ) {
    Alert.alert(
      'Data inválida',
      'Informe uma data e horário futuros.'
    );
    return;
  }

  try {
    setLoading(true);

    const duration = Number(service.duration_minutes);

    if (!duration || duration <= 0) {
      throw new Error('Duração do serviço inválida.');
    }

    const endDate = new Date(
      selectedDate.getTime() + duration * 60000
    );

    const { data, error } = await supabase
      .from('appointments')
      .insert({
        shop_id: shop.id,
        customer_id: session.user.id,
        barber_id: barber.id,
        service_id: service.id,
        starts_at: selectedDate.toISOString(),
        ends_at: endDate.toISOString(),
        status: 'pending_payment'
      })
      .select()
      .single();

    if (error) throw error;

    setAppointments([
      ...appointments,
      {
        shop: shop.name,
        service: service.name,
        barber: barber.name,
        date: appointmentDate,
        hour,
        price: service.price_cents / 100
      }
    ]);

    setPage('confirmation');

    Alert.alert(
      'Sucesso!',
      'Agendamento salvo no sistema.'
    );

  } catch (error) {
    console.log('Erro ao salvar agendamento:', error.message);

    Alert.alert(
      'Erro ao agendar',
      error.message
    );

  } finally {
    setLoading(false);
  }
}

  function Header() {
    return (
      <View style={styles.header}>
        <Text style={styles.logo}>BARBERPRO</Text>
        <Text style={styles.tagline}>SEU ESTILO. SEU HORÁRIO.</Text>
      </View>
    );
  }

  function Button({ title, action, outline }) {
    return (
      <TouchableOpacity
        style={[styles.button, outline && styles.outline]}
        onPress={action}>
        <Text style={[styles.buttonText, outline && { color: gold }]}>
          {title}
        </Text>
      </TouchableOpacity>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Header />

        {page === 'home' && <>
          <Text style={styles.title}>Encontre sua barbearia</Text>
          {session && (
  <View style={styles.card}>
    <Text style={styles.gold}>
      Olá, {session.user.user_metadata?.full_name ||
        session.user.email}!
    </Text>

    <Text style={styles.subtitle}>
      Você está conectado ao BarberPro.
    </Text>
    <Button
  title="CADASTRAR MINHA BARBEARIA"
  action={() => setPage('registerShop')}
/>
    <Button
  title="MEU PERFIL"
  action={() => setPage('profile')}
  outline
/>
<Button
  title="MINHAS BARBEARIAS"
  action={async () => {
    await loadMyShops();
    setPage('myShops');
  }}
  outline
/>

    <Button
      title="SAIR DA CONTA"
      action={handleSignOut}
      outline
    />
  </View>
)}
          <Text style={styles.subtitle}>
            Os melhores profissionais perto de você.
          </Text>

          {shops.map(item => (
            <TouchableOpacity
              key={item.id}
              style={styles.card}
              onPress={() => {
  setShop(item);
  setService(null);
  loadServices(item.id);
  loadBarbers(item.id);
  setPage('services');
}}>
              <Text style={styles.shopIcon}>✂️</Text>
              <Text style={styles.cardTitle}>{item.name}</Text>
              <Text style={styles.subtitle}>{item.city}</Text>
              <Text style={styles.gold}>★ {item.rating}</Text>
              <Text style={styles.gold}>
  {item.services?.filter(service => service.active).length > 0
    ? 'A partir de ' +
      (Math.min(
        ...item.services
          .filter(service => service.active)
          .map(service => service.price_cents)
      ) / 100).toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      })
    : 'Consulte os serviços'}
</Text>
              <Text style={styles.link}>VER SERVIÇOS →</Text>
            </TouchableOpacity>
          ))}

          {!session && (
  <Button
    title="ENTRAR / CADASTRAR"
    action={() => {
      setAuthMode('login');
      setPage('login');
    }}
    outline
  />
)}
          <Button title="MEUS AGENDAMENTOS" action={() => setPage('appointments')} outline />
        </>}

        
{page === 'login' && <>
  <Text style={styles.title}>
    {authMode === 'login' ? 'Bem-vindo de volta' : 'Criar minha conta'}
  </Text>

  <Text style={styles.subtitle}>
    {authMode === 'login'
      ? 'Entre para agendar seu horário.'
      : 'Cadastre-se no BarberPro gratuitamente.'}
  </Text>

  {authMode === 'signup' && (
    <TextInput
      style={styles.input}
      placeholder="Nome completo"
      placeholderTextColor="#888"
      value={name}
      onChangeText={setName}
    />
  )}

  <TextInput
    style={styles.input}
    placeholder="Seu e-mail"
    placeholderTextColor="#888"
    value={email}
    onChangeText={setEmail}
    keyboardType="email-address"
    autoCapitalize="none"
  />

  
{isRecoveryMode ? (
  <TextInput
    style={styles.input}
    placeholder="Digite sua nova senha"
    placeholderTextColor="#888"
    secureTextEntry
    value={newPassword}
    onChangeText={setNewPassword}
  />
) : (
  <TextInput
    style={styles.input}
    placeholder="Sua senha (mínimo 6 caracteres)"
    placeholderTextColor="#888"
    secureTextEntry
    value={password}
    onChangeText={setPassword}
  />
)}


  
<Button
  title={
    loading ? 'AGUARDE...' :
    isRecoveryMode ? 'SALVAR NOVA SENHA' :
    authMode === 'login' ? 'ENTRAR' : 'CRIAR CONTA'
  }
  action={
    isRecoveryMode ? handleUpdatePassword :
    authMode === 'login' ? handleSignIn : handleSignUp
  }
/>

{authMode === 'login' && (
  <Button
    title="ESQUECI MINHA SENHA"
    action={handlePasswordReset}
    outline
  />
)}
  <Button
    title={authMode === 'login'
      ? 'CRIAR NOVA CONTA'
      : 'JÁ TENHO UMA CONTA'}
    action={() => setAuthMode(
      authMode === 'login' ? 'signup' : 'login'
    )}
    outline
  />

  <Button
    title="VOLTAR"
    action={() => setPage('home')}
    outline
  />
</>}
{page === 'profile' && <>
  <Text style={styles.title}>Meu perfil</Text>

  <Text style={styles.subtitle}>
    Atualize seus dados pessoais.
  </Text>

  <Text style={styles.gold}>Nome completo</Text>

  <TextInput
    style={styles.input}
    placeholder="Seu nome"
    placeholderTextColor="#888"
    value={profile.full_name}
    onChangeText={(value) =>
      setProfile(prev => ({
        ...prev,
        full_name: value
      }))
    }
  />

  <Text style={styles.gold}>Telefone</Text>

  <TextInput
    style={styles.input}
    placeholder="Seu telefone"
    placeholderTextColor="#888"
    keyboardType="phone-pad"
    value={profile.phone}
    onChangeText={(value) =>
      setProfile(prev => ({
        ...prev,
        phone: value
      }))
    }
  />

  <Button
    title={profileLoading ? 'SALVANDO...' : 'SALVAR ALTERAÇÕES'}
    action={saveProfile}
  />

  <Button
    title="VOLTAR"
    action={() => setPage('home')}
    outline
  />
</>}

{page === 'registerShop' && (
  <>
    <Text style={styles.title}>
      Cadastrar minha barbearia
    </Text>

    <Text style={styles.subtitle}>
      Informe os dados do seu estabelecimento.
    </Text>

    <View style={styles.card}>
      <Text style={styles.gold}>Nome da barbearia *</Text>
      <TextInput
        style={styles.input}
        placeholder="Ex: Barbearia do Willian"
        placeholderTextColor="#888"
        value={newShop.name}
        onChangeText={(value) =>
          setNewShop(prev => ({ ...prev, name: value }))
        }
      />

      <Text style={styles.gold}>Descrição</Text>
      <TextInput
        style={styles.input}
        placeholder="Descreva sua barbearia"
        placeholderTextColor="#888"
        value={newShop.description}
        onChangeText={(value) =>
          setNewShop(prev => ({ ...prev, description: value }))
        }
      />

      <Text style={styles.gold}>Cidade *</Text>
      <TextInput
        style={styles.input}
        placeholder="Ex: Hortolândia - SP"
        placeholderTextColor="#888"
        value={newShop.city}
        onChangeText={(value) =>
          setNewShop(prev => ({ ...prev, city: value }))
        }
      />

      <Text style={styles.gold}>Endereço</Text>
      <TextInput
        style={styles.input}
        placeholder="Rua, número e bairro"
        placeholderTextColor="#888"
        value={newShop.address}
        onChangeText={(value) =>
          setNewShop(prev => ({ ...prev, address: value }))
        }
      />

      <Button
        title={shopLoading ? 'CADASTRANDO...' : 'CADASTRAR BARBEARIA'}
        action={registerShop}
      />

      <Button
        title="VOLTAR"
        action={() => setPage('home')}
        outline
      />
    </View>
  </>
)}
{page === 'myShops' && (
  <>
    <Text style={styles.title}>Minhas barbearias</Text>

    <Text style={styles.subtitle}>
      Gerencie suas barbearias e estabelecimentos da sua equipe.
    </Text>

    {myShopsLoading ? (
      <Text style={styles.subtitle}>
        Carregando barbearias...
      </Text>
    ) : myShops.length === 0 ? (
      <Text style={styles.subtitle}>
        Você ainda não possui barbearias cadastradas ou vinculadas.
      </Text>
    ) : (
      myShops.map((item) => (
        <TouchableOpacity
          key={item.id}
          style={styles.card}
          onPress={() => {
  setShop(item);
  setPage('shopAdmin');
}}
        >
          <Text style={styles.cardTitle}>{item.name}</Text>

          <Text style={styles.subtitle}>
            {item.city}
          </Text>

          <Text style={styles.link}>
            GERENCIAR BARBEARIA →
          </Text>
        </TouchableOpacity>
      ))
    )}

    <Button
      title="CADASTRAR NOVA BARBEARIA"
      action={() => setPage('registerShop')}
    />

    <Button
      title="VOLTAR"
      action={() => setPage('home')}
      outline
    />
  </>
)}

{page === 'shopAdmin' && (
  <>
    <Text style={styles.title}>Painel da Barbearia</Text>

    <View style={styles.card}>
      <Text style={styles.cardTitle}>
        {shop?.name || 'Minha Barbearia'}
      </Text>

      <Text style={styles.subtitle}>
        {shop?.city || ''}
      </Text>

      <Text style={styles.subtitle}>
        Gerencie os serviços, barbeiros e agendamentos
        do seu estabelecimento.
      </Text>
    </View>

    {(shop?.member_role === 'owner' ||
  shop?.member_role === 'staff') && (
  <>
    <Button
      title="GERENCIAR SERVIÇOS"
      action={() => setPage('manageServices')}
    />

    <Button
  title="GERENCIAR BARBEIROS"
  action={async () => {
    setPage('manageBarbers');
    await loadBarbers(shop.id);
  }}
  outline
/>

    <Button
      title="AGENDAMENTOS"
      action={() => setPage('manageAppointments')}
      outline
    />
  </>
)}

    <Button
      title="VOLTAR"
      action={() => setPage('myShops')}
      outline
    />
  </>
)}

{page === 'manageBarbers' && (
  <>
    <Text style={styles.title}>Gerenciar Barbeiros</Text>

    <Text style={styles.subtitle}>
      {shop?.name}
    </Text>

    <View style={styles.card}>
      <Text style={styles.cardTitle}>
        Convidar novo barbeiro
      </Text>

      <Text style={styles.gold}>Nome completo</Text>
      <TextInput
        style={styles.input}
        placeholder="Nome do barbeiro"
        placeholderTextColor="#888"
        value={inviteBarberName}
        onChangeText={setInviteBarberName}
      />

      <Text style={styles.gold}>E-mail</Text>
      <TextInput
        style={styles.input}
        placeholder="email@exemplo.com"
        placeholderTextColor="#888"
        keyboardType="email-address"
        autoCapitalize="none"
        value={inviteBarberEmail}
        onChangeText={setInviteBarberEmail}
      />

      <Button
        title={
          inviteBarberLoading
            ? 'ENVIANDO CONVITE...'
            : 'ENVIAR CONVITE'
        }
        action={handleInviteBarber}
      />
    </View>

    <Text style={styles.cardTitle}>
      Barbeiros cadastrados
    </Text>

    {barbersLoading ? (
      <Text style={styles.subtitle}>
        Carregando barbeiros...
      </Text>
    ) : barbers.length === 0 ? (
      <Text style={styles.subtitle}>
        Nenhum barbeiro cadastrado nesta barbearia.
      </Text>
    ) : (
      barbers.map((item) => (
        <View key={item.id} style={styles.card}>
          <Text style={styles.cardTitle}>
            {item.name}
          </Text>

          {item.phone ? (
            <Text style={styles.subtitle}>
              Telefone: {item.phone}
            </Text>
          ) : null}

          {item.specialty ? (
            <Text style={styles.subtitle}>
              Especialidade: {item.specialty}
            </Text>
          ) : null}

          <Text style={styles.gold}>Barbeiro ativo</Text>
        </View>
      ))
    )}

    <Button
      title="ATUALIZAR LISTA"
      action={() => loadBarbers(shop.id)}
      outline
    />

    <Button
      title="VOLTAR AO PAINEL"
      action={() => setPage('shopAdmin')}
      outline
    />
  </>
)}

{page === 'manageServices' && (
  <>
    <Text style={styles.title}>Gerenciar Serviços</Text>

    <Text style={styles.subtitle}>
      {shop?.name}
    </Text>

    <View style={styles.card}>
      <Text style={styles.gold}>Nome do serviço *</Text>
      <TextInput
        style={styles.input}
        placeholder="Ex: Corte masculino"
        placeholderTextColor="#888"
        value={newService.name}
        onChangeText={(value) =>
          setNewService(prev => ({ ...prev, name: value }))
        }
      />

      <Text style={styles.gold}>Descrição</Text>
      <TextInput
        style={styles.input}
        placeholder="Descreva o serviço"
        placeholderTextColor="#888"
        value={newService.description}
        onChangeText={(value) =>
          setNewService(prev => ({ ...prev, description: value }))
        }
      />

      <Text style={styles.gold}>Preço (R$) *</Text>
      <TextInput
        style={styles.input}
        placeholder="Ex: 35,00"
        placeholderTextColor="#888"
        keyboardType="decimal-pad"
        value={newService.price}
        onChangeText={(value) =>
          setNewService(prev => ({ ...prev, price: value }))
        }
      />

      <Text style={styles.gold}>Duração (minutos)</Text>
      <TextInput
        style={styles.input}
        keyboardType="numeric"
        value={newService.duration}
        onChangeText={(value) =>
          setNewService(prev => ({ ...prev, duration: value }))
        }
      />

      <Button
        title={serviceSaving ? 'SALVANDO...' : 'CADASTRAR SERVIÇO'}
        action={handleCreateService}
      />

      <Button
        title="VOLTAR"
        action={() => setPage('shopAdmin')}
        outline
      />
    </View>
  </>
)}
        {page === 'services' && <>
          <Text style={styles.title}>{shop?.name}</Text>
          <Text style={styles.subtitle}>Escolha seu serviço</Text>
          {servicesLoading ? (
  <Text style={styles.subtitle}>Carregando serviços...</Text>
) : services.length === 0 ? (
  <Text style={styles.subtitle}>
    Nenhum serviço cadastrado nesta barbearia.
  </Text>
) : (
  services.map((item) => (
    <TouchableOpacity
      key={item.id}
      style={styles.card}
      onPress={() => {
        setService(item);
        setPage('barbers');
      }}
    >
      <Text style={styles.cardTitle}>{item.name}</Text>

      <Text style={styles.gold}>
        R$ {(item.price_cents / 100).toFixed(2).replace('.', ',')}
      </Text>

      <Text style={styles.subtitle}>
        {item.duration_minutes} min
      </Text>
    </TouchableOpacity>
  ))
)}
          <Button title="VOLTAR" action={() => setPage('home')} outline />
        </>}

        {page === 'barbers' && <>
          <Text style={styles.title}>Escolha seu barbeiro</Text>
          {barbers.map((item, i) => (
            <TouchableOpacity
              key={i}
              style={styles.card}
              onPress={() => {
                setBarber(item);
                setPage('schedule');
              }}>
              <Text style={styles.cardTitle}>{item.name}</Text>
              <Text style={styles.subtitle}>{item.specialty}</Text>
            </TouchableOpacity>
          ))}
          <Button title="VOLTAR" action={() => setPage('services')} outline />
        </>}

        {page === 'schedule' && <>
          <Text style={styles.title}>Agende seu horário</Text>
          <Text style={styles.subtitle}>Profissional: {barber?.name}</Text>
          <Text style={styles.subtitle}>Escolha a data do atendimento</Text>
<TextInput
  style={styles.input}
  placeholder="AAAA-MM-DD (ex.: 2026-11-10)"
  placeholderTextColor="#999"
  value={appointmentDate}
  onChangeText={setAppointmentDate}
/>
          <Text style={styles.gold}>Escolha um horário</Text>
          <View style={styles.hours}>
            {hours.map(item => (
              <TouchableOpacity
                key={item}
                onPress={() => setHour(item)}
                style={[styles.hour, hour === item && styles.selected]}>
                <Text style={{ color: hour === item ? '#111' : '#FFF' }}>
                  {item}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.subtitle}>
            Horários demonstrativos, ainda não consultam disponibilidade real.
          </Text>
          <Button title="CONFIRMAR AGENDAMENTO" action={confirmBooking} />
          <Button title="VOLTAR" action={() => setPage('barbers')} outline />
        </>}

        {page === 'confirmation' && <>
          <Text style={styles.title}>Agendamento realizado!</Text>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{shop?.name}</Text>
            <Text style={styles.subtitle}>{service?.name}</Text>
            <Text style={styles.subtitle}>{barber?.name}</Text>
            <Text style={styles.subtitle}>Data: {appointmentDate}</Text>
            <Text style={styles.gold}>Horário: {hour}</Text>
            <Text style={styles.gold}>
  R$ {((service?.price_cents ?? 0) / 100).toFixed(2).replace('.', ',')}
</Text>
          </View>
          <Text style={styles.subtitle}>
            O pagamento será integrado ao Mercado Pago na próxima etapa.
          </Text>
          <Button title="VOLTAR AO INÍCIO" action={() => setPage('home')} />
        </>}

        {page === 'appointments' && <>
          <Text style={styles.title}>Meus agendamentos</Text>
          {appointments.length === 0
            ? <Text style={styles.subtitle}>Nenhum agendamento realizado.</Text>
            : appointments.map((item, i) => (
              <View style={styles.card} key={i}>
                <Text style={styles.cardTitle}>{item.shop}</Text>
                <Text style={styles.subtitle}>{item.service}</Text>
                <Text style={styles.gold}>{item.hour} • R$ {item.price}</Text>
              </View>
            ))}
          <Button title="VOLTAR" action={() => setPage('home')} outline />
        </>}

        <Text style={styles.footer}>BARBERPRO © 2026</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#101010' },
  content: { padding: 20, paddingBottom: 40 },
  header: { marginBottom: 30, borderBottomWidth: 1, borderColor: '#333', paddingBottom: 20 },
  logo: { fontSize: 30, fontWeight: '900', color: '#D5AD65', letterSpacing: 3 },
  tagline: { color: '#999', fontSize: 10, letterSpacing: 2, marginTop: 5 },
  title: { color: '#FFF', fontSize: 24, fontWeight: 'bold', marginBottom: 12 },
  subtitle: { color: '#AAA', marginBottom: 12 },
  card: { backgroundColor: '#202020', borderRadius: 14, padding: 18, marginBottom: 14, borderWidth: 1, borderColor: '#383838' },
  cardTitle: { color: '#FFF', fontSize: 18, fontWeight: 'bold', marginBottom: 7 },
  gold: { color: '#D5AD65', fontWeight: 'bold', marginTop: 5 },
  shopIcon: { fontSize: 28, marginBottom: 8 },
  link: { color: '#D5AD65', marginTop: 14, fontWeight: 'bold' },
  button: { backgroundColor: '#D5AD65', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 12 },
  outline: { backgroundColor: 'transparent', borderWidth: 1, borderColor: '#D5AD65' },
  buttonText: { color: '#111', fontWeight: 'bold' },
  input: { backgroundColor: '#202020', borderWidth: 1, borderColor: '#444', padding: 15, borderRadius: 10, color: '#FFF', marginBottom: 12 },
  hours: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginVertical: 20 },
  hour: { padding: 15, backgroundColor: '#292929', borderRadius: 10 },
  selected: { backgroundColor: '#D5AD65' },
  footer: { color: '#666', textAlign: 'center', marginTop: 35, fontSize: 11 }
});

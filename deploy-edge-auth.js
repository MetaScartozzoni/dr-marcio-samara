//Copie o novo código que forneci acima para seu arquivo local em supabase/functions/auth/index.ts

//No terminal, dentro da pasta raiz do seu projeto, execute:
//
//supabase 
//functions
 //deploy auth --no-verify-jwt
//
//O parâmetro --no-verify-jwt é importante porque você tem endpoints públicos como o de registro e login que precisam ser acessados sem um token JWT.
//
//
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Hono } from "npm:hono@3.9.2";
import { cors } from "npm:hono@3.9.2/middleware/cors";
import { createClient } from "npm:@supabase/supabase-js@2.38.4";

const app = new Hono();

// Define the Supabase client
const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") || "";
const supabaseServiceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

// Add CORS middleware
app.use("*", cors());

/**
 * Progressive User Model:
 * 
 * 1. Contact: Initial point of contact - minimal info required
 * 2. Patient: Created when a contact schedules an appointment
 * 3. Employee/Doctor: Created via admin interface
 * 
 * All users have a core user record in auth.users and a corresponding profiles entry.
 * The 'role' in user_metadata determines additional tables where data is stored.
 */

// Helper function to get user profile data based on role
async function getUserProfile(supabase, userId, role) {
  let roleData = null;
  
  if (role === "doctor") {
    const { data } = await supabase
      .from("doctors")
      .select("*")
      .eq("user_id", userId)
      .single();
    roleData = data;
  } 
  else if (role === "patient") {
    const { data } = await supabase
      .from("patients")
      .select("*")
      .eq("user_id", userId)
      .single();
    roleData = data;
  } 
  else if (role === "employee" || role === "admin") {
    const { data } = await supabase
      .from("employees")
      .select("*")
      .eq("user_id", userId)
      .single();
    roleData = data;
  }
  // For contact role, we just return the profiles data
  
  return roleData;
}

// Create standardized response format
function createResponse(success, message, data = {}) {
  return {
    success,
    message,
    ...data
  };
}

// Register endpoint - unified registration for all user types
app.post("/auth/register", async (c) => {
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRole);
  const payload = await c.req.json();
  const { 
    email, 
    password, 
    full_name, 
    phone,
    // Role defaults to "contact" if not specified
    role = "contact" 
  } = payload;

  // Special fields for specific roles
  const { crm, specialty, employee_type } = payload;

  // Basic validation
  if (!email || !password || !full_name) {
    return c.json(createResponse(false, "Email, password, and full name are required"), 400);
  }

  // Role-specific validation
  if (role === "doctor" && !crm) {
    return c.json(createResponse(false, "CRM is required for doctor registration"), 400);
  }

  // Admin role can only be created by an administrator
  if (role === "admin" || role === "employee" || role === "doctor") {
    // Check authorization token to see if request is from an admin
    const authHeader = c.req.header("Authorization");
    if (!authHeader) {
      return c.json(createResponse(false, "Administrative privileges required"), 403);
    }

    try {
      const token = authHeader.replace("Bearer ", "");
      const { data: { user }, error: verifyError } = await supabaseAdmin.auth.getUser(token);
      
      if (verifyError || !user) throw new Error("Unauthorized");

      // Check if requester is an admin
      const { data: requesterProfile } = await supabaseAdmin
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (requesterProfile?.role !== "admin") {
        return c.json(createResponse(false, "Administrative privileges required"), 403);
      }
    } catch (error) {
      return c.json(createResponse(false, "Invalid authorization"), 403);
    }
  }

  try {
    // 1. Create the user in auth
    const { data: userData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { 
        full_name, 
        role  // Store role in user_metadata
      }
    });

    if (authError) throw authError;
    
    const userId = userData.user.id;

    // 2. Create entry in profiles table (for all users)
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .insert({
        id: userId,
        full_name,
        email,
        role,
        phone: phone || null
      });

    if (profileError) throw profileError;

    // 3. Create role-specific profile based on role
    let specificProfile = null;
    let specificError = null;
    
    if (role === "doctor") {
      const result = await supabaseAdmin
        .from("doctors")
        .insert({
          user_id: userId,
          full_name,
          crm,
          specialty: specialty || "",
          email,
          phone: phone || null,
          is_active: true
        })
        .select()
        .single();
      specificError = result.error;
      specificProfile = result.data;
    } 
    else if (role === "patient") {
      const result = await supabaseAdmin
        .from("patients")
        .insert({
          user_id: userId,
          full_name,
          phone: phone || null,
          email,
          status: "active"
        })
        .select()
        .single();
      specificError = result.error;
      specificProfile = result.data;
    }
    else if (role === "employee" || role === "admin") {
      const result = await supabaseAdmin
        .from("employees")
        .insert({
          user_id: userId,
          email,
          full_name,
          role,
          employee_type: employee_type || role,
          is_active: true,
          phone: phone || null
        })
        .select()
        .single();
      specificError = result.error;
      specificProfile = result.data;
    }
    // For "contact" role, no additional table entry is needed

    if (specificError) throw specificError;

    return c.json(createResponse(
      true,
      `${role.charAt(0).toUpperCase() + role.slice(1)} registered successfully`,
      {
        user: userData.user,
        profile: specificProfile
      }
    ), 201);
  } catch (error) {
    console.error(`Error during registration:`, error);
    return c.json(createResponse(false, error.message), 500);
  }
});

// Login endpoint - works for all user types
app.post("/auth/login", async (c) => {
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  const { email, password } = await c.req.json();

  if (!email || !password) {
    return c.json(createResponse(false, "Email and password are required"), 400);
  }

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) throw error;

    // Get user role from metadata
    const role = data.user?.user_metadata?.role || "contact";
    
    // Get role-specific profile data if available
    const roleData = await getUserProfile(supabase, data.user.id, role);

    return c.json(createResponse(
      true,
      "Login successful",
      {
        session: data.session,
        user: data.user,
        profile: roleData
      }
    ));
  } catch (error) {
    console.error("Login error:", error);
    return c.json(createResponse(false, `Login failed: ${error.message}`), 401);
  }
});

// Promote contact to patient (when they schedule first appointment)
app.post("/auth/promote-to-patient", async (c) => {
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRole);
  const { user_id, additional_data = {} } = await c.req.json();

  if (!user_id) {
    return c.json(createResponse(false, "User ID is required"), 400);
  }

  try {
    // 1. Get current user data
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(user_id);
    if (userError) throw userError;

    // 2. Check if user is currently a contact
    if (userData.user.user_metadata?.role !== "contact") {
      return c.json(createResponse(false, "User is already a patient or has another role"), 400);
    }

    // 3. Update user metadata role to patient
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      user_id,
      {
        user_metadata: {
          ...userData.user.user_metadata,
          role: "patient"
        }
      }
    );
    if (updateError) throw updateError;

    // 4. Update profile record
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .update({ role: "patient" })
      .eq("id", user_id);
    if (profileError) throw profileError;

    // 5. Create patient record
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .eq("id", user_id)
      .single();

    const patientData = {
      user_id,
      full_name: profile.full_name,
      email: profile.email,
      phone: profile.phone,
      status: "active",
      ...additional_data
    };

    const { data: patient, error: patientError } = await supabaseAdmin
      .from("patients")
      .insert(patientData)
      .select()
      .single();
    if (patientError) throw patientError;

    return c.json(createResponse(
      true,
      "Contact promoted to patient successfully",
      { patient }
    ));
  } catch (error) {
    console.error("Error promoting contact to patient:", error);
    return c.json(createResponse(false, error.message), 500);
  }
});

// Change user role (admin only)
app.post("/auth/change-role", async (c) => {
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRole);
  const { user_id, new_role, additional_data = {} } = await c.req.json();
  
  // Validate request
  if (!user_id || !new_role) {
    return c.json(createResponse(false, "User ID and new role are required"), 400);
  }

  // Verify admin privileges
  const authHeader = c.req.header("Authorization");
  if (!authHeader) {
    return c.json(createResponse(false, "Administrative privileges required"), 403);
  }

  try {
    // Check if requester is an admin
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: verifyError } = await supabaseAdmin.auth.getUser(token);
    
    if (verifyError || !user) throw new Error("Unauthorized");

    const { data: requesterProfile } = await supabaseAdmin
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (requesterProfile?.role !== "admin") {
      return c.json(createResponse(false, "Administrative privileges required"), 403);
    }

    // Get current user data
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(user_id);
    if (userError) throw userError;

    const current_role = userData.user.user_metadata?.role || "contact";
    
    // Update auth.users metadata
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      user_id,
      {
        user_metadata: {
          ...userData.user.user_metadata,
          role: new_role
        }
      }
    );
    if (updateError) throw updateError;

    // Update profiles table
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .update({ role: new_role })
      .eq("id", user_id);
    if (profileError) throw profileError;

    // Get user profile data
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .eq("id", user_id)
      .single();

    // Handle role-specific table operations
    let roleSpecificData = null;

    // Create new role record if needed
    if (new_role === "doctor" && current_role !== "doctor") {
      const { data, error } = await supabaseAdmin
        .from("doctors")
        .insert({
          user_id,
          full_name: profile.full_name,
          email: profile.email,
          phone: profile.phone,
          crm: additional_data.crm || "",
          specialty: additional_data.specialty || "",
          is_active: true
        })
        .select()
        .single();
      
      if (error) throw error;
      roleSpecificData = data;
    } 
    else if (new_role === "patient" && current_role !== "patient") {
      const { data, error } = await supabaseAdmin
        .from("patients")
        .insert({
          user_id,
          full_name: profile.full_name,
          email: profile.email,
          phone: profile.phone,
          status: "active",
          ...additional_data
        })
        .select()
        .single();
      
      if (error) throw error;
      roleSpecificData = data;
    }
    else if ((new_role === "employee" || new_role === "admin") && 
             (current_role !== "employee" && current_role !== "admin")) {
      const { data, error } = await supabaseAdmin
        .from("employees")
        .insert({
          user_id,
          full_name: profile.full_name,
          email: profile.email,
          phone: profile.phone,
          role: new_role,
          employee_type: additional_data.employee_type || new_role,
          is_active: true
        })
        .select()
        .single();
      
      if (error) throw error;
      roleSpecificData = data;
    }

    return c.json(createResponse(
      true,
      `User role changed from ${current_role} to ${new_role} successfully`,
      { profile: roleSpecificData }
    ));
  } catch (error) {
    console.error("Error changing user role:", error);
    return c.json(createResponse(false, error.message), 500);
  }
});

// Password reset request
app.post("/auth/reset-password", async (c) => {
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  const { email } = await c.req.json();

  if (!email) {
    return c.json(createResponse(false, "Email is required"), 400);
  }

  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    
    if (error) throw error;
    
    return c.json(createResponse(
      true,
      "Password reset instructions sent to your email"
    ));
  } catch (error) {
    console.error("Password reset error:", error);
    return c.json(createResponse(false, error.message), 500);
  }
});

serve(app.fetch);

//Teste a função chamando um dos endpoints, por exemplo:
const { data, error } = await supabase.functions.invoke('auth', {
  body: {
    email: 'teste@exemplo.com',
    password: 'senha123',
    full_name: 'Usuário Teste'
  },
  method: 'POST',
  path: '/register'
})

//Você também pode definir a configuração de verificação de JWT no arquivo supabase/config.toml:

[functions.auth]
verify_jwt = 
false

//Isso significa que você pode apenas fazer o deploy com supabase functions deploy auth sem precisar adicionar a flag --no-verify-jwt toda vez.
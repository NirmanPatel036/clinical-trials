'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, ArrowRight, ArrowLeft, User, Phone, Calendar, MapPin } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import BlurryBlob from '@/components/animata/background/blurry-blob';
import { Button } from '@/components/ui/Button';

type FormStep = 'account' | 'personal' | 'medical';

export default function SignupPage() {
  const [step, setStep] = useState<FormStep>('account');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  // Account Info
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Personal Info
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [countryCode, setCountryCode] = useState('+1');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [country, setCountry] = useState('United States');

  // Medical Info
  const [diagnosis, setDiagnosis] = useState('');
  const [stage, setStage] = useState('');
  const [currentTreatment, setCurrentTreatment] = useState('');
  const [allergies, setAllergies] = useState('');

  const handleSignup = async () => {
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Sign up user - the trigger will create the profile with all data
      const fullPhone = phone ? `${countryCode} ${phone}` : null;
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
            date_of_birth: dateOfBirth,
            phone: fullPhone,
            address: address || null,
            city: city || null,
            state: state || null,
            zip_code: zipCode || null,
            country: country || null,
            diagnosis: diagnosis || null,
            stage: stage || null,
            current_treatment: currentTreatment || null,
            allergies: allergies || null,
          },
        },
      });

      if (authError) throw authError;

      if (!authData.user) {
        throw new Error('User creation failed');
      }

      // Redirect to success page with email parameter
      router.push(`/auth/signup/success?email=${encodeURIComponent(email)}`);
    } catch (error: any) {
      console.error('Signup error:', error);
      setError(error.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => {
    if (step === 'account') {
      if (!email || !password || !confirmPassword) {
        setError('Please fill in all fields');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match');
        return;
      }
      setError('');
      setStep('personal');
    } else if (step === 'personal') {
      if (!firstName || !lastName || !dateOfBirth) {
        setError('Please fill in required fields');
        return;
      }
      setError('');
      setStep('medical');
    }
  };

  const prevStep = () => {
    setError('');
    if (step === 'medical') setStep('personal');
    else if (step === 'personal') setStep('account');
  };

  const renderStep = () => {
    switch (step) {
      case 'account':
        return (
          <motion.div
            key="account"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                Email Address *
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground placeholder:text-muted-foreground"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-foreground mb-2">
                Password *
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full pl-10 pr-12 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground placeholder:text-muted-foreground"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-foreground mb-2">
                Confirm Password *
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground placeholder:text-muted-foreground"
                  placeholder="••••••••"
                />
              </div>
            </div>
          </motion.div>
        );

      case 'personal':
        return (
          <motion.div
            key="personal"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-foreground mb-2">
                  First Name *
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    id="firstName"
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                    className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground placeholder:text-muted-foreground"
                    placeholder="John"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-foreground mb-2">
                  Last Name *
                </label>
                <input
                  id="lastName"
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground placeholder:text-muted-foreground"
                  placeholder="Doe"
                />
              </div>
            </div>

            <div>
              <label htmlFor="dateOfBirth" className="block text-sm font-medium text-foreground mb-2">
                Date of Birth *
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  id="dateOfBirth"
                  type="date"
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground"
                />
              </div>
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-foreground mb-2">
                Phone Number
              </label>
              <div className="flex gap-2">
                <select
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  className="w-32 px-3 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground text-sm"
                >
                  <option value="+1">🇺🇸 +1 (US)</option>
                  <option value="+1">🇨🇦 +1 (CA)</option>
                  <option value="+20">🇪🇬 +20 (EG)</option>
                  <option value="+27">🇿🇦 +27 (ZA)</option>
                  <option value="+30">🇬🇷 +30 (GR)</option>
                  <option value="+31">🇳🇱 +31 (NL)</option>
                  <option value="+32">🇧🇪 +32 (BE)</option>
                  <option value="+33">🇫🇷 +33 (FR)</option>
                  <option value="+34">🇪🇸 +34 (ES)</option>
                  <option value="+36">🇭🇺 +36 (HU)</option>
                  <option value="+39">🇮🇹 +39 (IT)</option>
                  <option value="+40">🇷🇴 +40 (RO)</option>
                  <option value="+41">🇨🇭 +41 (CH)</option>
                  <option value="+43">🇦🇹 +43 (AT)</option>
                  <option value="+44">🇬🇧 +44 (GB)</option>
                  <option value="+45">🇩🇰 +45 (DK)</option>
                  <option value="+46">🇸🇪 +46 (SE)</option>
                  <option value="+47">🇳🇴 +47 (NO)</option>
                  <option value="+48">🇵🇱 +48 (PL)</option>
                  <option value="+49">🇩🇪 +49 (DE)</option>
                  <option value="+51">🇵🇪 +51 (PE)</option>
                  <option value="+52">🇲🇽 +52 (MX)</option>
                  <option value="+53">🇨🇺 +53 (CU)</option>
                  <option value="+54">🇦🇷 +54 (AR)</option>
                  <option value="+55">🇧🇷 +55 (BR)</option>
                  <option value="+56">🇨🇱 +56 (CL)</option>
                  <option value="+57">🇨🇴 +57 (CO)</option>
                  <option value="+58">🇻🇪 +58 (VE)</option>
                  <option value="+60">🇲🇾 +60 (MY)</option>
                  <option value="+61">🇦🇺 +61 (AU)</option>
                  <option value="+62">🇮🇩 +62 (ID)</option>
                  <option value="+63">🇵🇭 +63 (PH)</option>
                  <option value="+64">🇳🇿 +64 (NZ)</option>
                  <option value="+65">🇸🇬 +65 (SG)</option>
                  <option value="+66">🇹🇭 +66 (TH)</option>
                  <option value="+81">🇯🇵 +81 (JP)</option>
                  <option value="+82">🇰🇷 +82 (KR)</option>
                  <option value="+84">🇻🇳 +84 (VN)</option>
                  <option value="+86">🇨🇳 +86 (CN)</option>
                  <option value="+90">🇹🇷 +90 (TR)</option>
                  <option value="+91">🇮🇳 +91 (IN)</option>
                  <option value="+92">🇵🇰 +92 (PK)</option>
                  <option value="+93">🇦🇫 +93 (AF)</option>
                  <option value="+94">🇱🇰 +94 (LK)</option>
                  <option value="+95">🇲🇲 +95 (MM)</option>
                  <option value="+98">🇮🇷 +98 (IR)</option>
                  <option value="+212">🇲🇦 +212 (MA)</option>
                  <option value="+213">🇩🇿 +213 (DZ)</option>
                  <option value="+216">🇹🇳 +216 (TN)</option>
                  <option value="+218">🇱🇾 +218 (LY)</option>
                  <option value="+220">🇬🇲 +220 (GM)</option>
                  <option value="+221">🇸🇳 +221 (SN)</option>
                  <option value="+222">🇲🇷 +222 (MR)</option>
                  <option value="+223">🇲🇱 +223 (ML)</option>
                  <option value="+224">🇬🇳 +224 (GN)</option>
                  <option value="+225">🇨🇮 +225 (CI)</option>
                  <option value="+226">🇧🇫 +226 (BF)</option>
                  <option value="+227">🇳🇪 +227 (NE)</option>
                  <option value="+228">🇹🇬 +228 (TG)</option>
                  <option value="+229">🇧🇯 +229 (BJ)</option>
                  <option value="+230">🇲🇺 +230 (MU)</option>
                  <option value="+231">🇱🇷 +231 (LR)</option>
                  <option value="+232">🇸🇱 +232 (SL)</option>
                  <option value="+233">🇬🇭 +233 (GH)</option>
                  <option value="+234">🇳🇬 +234 (NG)</option>
                  <option value="+235">🇹🇩 +235 (TD)</option>
                  <option value="+236">🇨🇫 +236 (CF)</option>
                  <option value="+237">🇨🇲 +237 (CM)</option>
                  <option value="+238">🇨🇻 +238 (CV)</option>
                  <option value="+239">🇸🇹 +239 (ST)</option>
                  <option value="+240">🇬🇶 +240 (GQ)</option>
                  <option value="+241">🇬🇦 +241 (GA)</option>
                  <option value="+242">🇨🇬 +242 (CG)</option>
                  <option value="+243">🇨🇩 +243 (CD)</option>
                  <option value="+244">🇦🇴 +244 (AO)</option>
                  <option value="+245">🇬🇼 +245 (GW)</option>
                  <option value="+248">🇸🇨 +248 (SC)</option>
                  <option value="+249">🇸🇩 +249 (SD)</option>
                  <option value="+250">🇷🇼 +250 (RW)</option>
                  <option value="+251">🇪🇹 +251 (ET)</option>
                  <option value="+252">🇸🇴 +252 (SO)</option>
                  <option value="+253">🇩🇯 +253 (DJ)</option>
                  <option value="+254">🇰🇪 +254 (KE)</option>
                  <option value="+255">🇹🇿 +255 (TZ)</option>
                  <option value="+256">🇺🇬 +256 (UG)</option>
                  <option value="+257">🇧🇮 +257 (BI)</option>
                  <option value="+258">🇲🇿 +258 (MZ)</option>
                  <option value="+260">🇿🇲 +260 (ZM)</option>
                  <option value="+261">🇲🇬 +261 (MG)</option>
                  <option value="+262">🇷🇪 +262 (RE)</option>
                  <option value="+263">🇿🇼 +263 (ZW)</option>
                  <option value="+264">🇳🇦 +264 (NA)</option>
                  <option value="+265">🇲🇼 +265 (MW)</option>
                  <option value="+266">🇱🇸 +266 (LS)</option>
                  <option value="+267">🇧🇼 +267 (BW)</option>
                  <option value="+268">🇸🇿 +268 (SZ)</option>
                  <option value="+269">🇰🇲 +269 (KM)</option>
                  <option value="+290">🇸🇭 +290 (SH)</option>
                  <option value="+291">🇪🇷 +291 (ER)</option>
                  <option value="+297">🇦🇼 +297 (AW)</option>
                  <option value="+298">🇫🇴 +298 (FO)</option>
                  <option value="+299">🇬🇱 +299 (GL)</option>
                  <option value="+350">🇬🇮 +350 (GI)</option>
                  <option value="+351">🇵🇹 +351 (PT)</option>
                  <option value="+352">🇱🇺 +352 (LU)</option>
                  <option value="+353">🇮🇪 +353 (IE)</option>
                  <option value="+354">🇮🇸 +354 (IS)</option>
                  <option value="+355">🇦🇱 +355 (AL)</option>
                  <option value="+356">🇲🇹 +356 (MT)</option>
                  <option value="+357">🇨🇾 +357 (CY)</option>
                  <option value="+358">🇫🇮 +358 (FI)</option>
                  <option value="+359">🇧🇬 +359 (BG)</option>
                  <option value="+370">🇱🇹 +370 (LT)</option>
                  <option value="+371">🇱🇻 +371 (LV)</option>
                  <option value="+372">🇪🇪 +372 (EE)</option>
                  <option value="+373">🇲🇩 +373 (MD)</option>
                  <option value="+374">🇦🇲 +374 (AM)</option>
                  <option value="+375">🇧🇾 +375 (BY)</option>
                  <option value="+376">🇦🇩 +376 (AD)</option>
                  <option value="+377">🇲🇨 +377 (MC)</option>
                  <option value="+378">🇸🇲 +378 (SM)</option>
                  <option value="+380">🇺🇦 +380 (UA)</option>
                  <option value="+381">🇷🇸 +381 (RS)</option>
                  <option value="+382">🇲🇪 +382 (ME)</option>
                  <option value="+383">🇽🇰 +383 (XK)</option>
                  <option value="+385">🇭🇷 +385 (HR)</option>
                  <option value="+386">🇸🇮 +386 (SI)</option>
                  <option value="+387">🇧🇦 +387 (BA)</option>
                  <option value="+389">🇲🇰 +389 (MK)</option>
                  <option value="+420">🇨🇿 +420 (CZ)</option>
                  <option value="+421">🇸🇰 +421 (SK)</option>
                  <option value="+423">🇱🇮 +423 (LI)</option>
                  <option value="+500">🇫🇰 +500 (FK)</option>
                  <option value="+501">🇧🇿 +501 (BZ)</option>
                  <option value="+502">🇬🇹 +502 (GT)</option>
                  <option value="+503">🇸🇻 +503 (SV)</option>
                  <option value="+504">🇭🇳 +504 (HN)</option>
                  <option value="+505">🇳🇮 +505 (NI)</option>
                  <option value="+506">🇨🇷 +506 (CR)</option>
                  <option value="+507">🇵🇦 +507 (PA)</option>
                  <option value="+508">🇵🇲 +508 (PM)</option>
                  <option value="+509">🇭🇹 +509 (HT)</option>
                  <option value="+590">🇬🇵 +590 (GP)</option>
                  <option value="+591">🇧🇴 +591 (BO)</option>
                  <option value="+592">🇬🇾 +592 (GY)</option>
                  <option value="+593">🇪🇨 +593 (EC)</option>
                  <option value="+594">🇬🇫 +594 (GF)</option>
                  <option value="+595">🇵🇾 +595 (PY)</option>
                  <option value="+596">🇲🇶 +596 (MQ)</option>
                  <option value="+597">🇸🇷 +597 (SR)</option>
                  <option value="+598">🇺🇾 +598 (UY)</option>
                  <option value="+670">🇹🇱 +670 (TL)</option>
                  <option value="+672">🇦🇶 +672 (AQ)</option>
                  <option value="+673">🇧🇳 +673 (BN)</option>
                  <option value="+674">🇳🇷 +674 (NR)</option>
                  <option value="+675">🇵🇬 +675 (PG)</option>
                  <option value="+676">🇹🇴 +676 (TO)</option>
                  <option value="+677">🇸🇧 +677 (SB)</option>
                  <option value="+678">🇻🇺 +678 (VU)</option>
                  <option value="+679">🇫🇯 +679 (FJ)</option>
                  <option value="+680">🇵🇼 +680 (PW)</option>
                  <option value="+681">🇼🇫 +681 (WF)</option>
                  <option value="+682">🇨🇰 +682 (CK)</option>
                  <option value="+683">🇳🇺 +683 (NU)</option>
                  <option value="+685">🇼🇸 +685 (WS)</option>
                  <option value="+686">🇰🇮 +686 (KI)</option>
                  <option value="+687">🇳🇨 +687 (NC)</option>
                  <option value="+688">🇹🇻 +688 (TV)</option>
                  <option value="+689">🇵🇫 +689 (PF)</option>
                  <option value="+690">🇹🇰 +690 (TK)</option>
                  <option value="+691">🇫🇲 +691 (FM)</option>
                  <option value="+692">🇲🇭 +692 (MH)</option>
                  <option value="+850">🇰🇵 +850 (KP)</option>
                  <option value="+852">🇭🇰 +852 (HK)</option>
                  <option value="+853">🇲🇴 +853 (MO)</option>
                  <option value="+855">🇰🇭 +855 (KH)</option>
                  <option value="+856">🇱🇦 +856 (LA)</option>
                  <option value="+880">🇧🇩 +880 (BD)</option>
                  <option value="+886">🇹🇼 +886 (TW)</option>
                  <option value="+960">🇲🇻 +960 (MV)</option>
                  <option value="+961">🇱🇧 +961 (LB)</option>
                  <option value="+962">🇯🇴 +962 (JO)</option>
                  <option value="+963">🇸🇾 +963 (SY)</option>
                  <option value="+964">🇮🇶 +964 (IQ)</option>
                  <option value="+965">🇰🇼 +965 (KW)</option>
                  <option value="+966">🇸🇦 +966 (SA)</option>
                  <option value="+967">🇾🇪 +967 (YE)</option>
                  <option value="+968">🇴🇲 +968 (OM)</option>
                  <option value="+970">🇵🇸 +970 (PS)</option>
                  <option value="+971">🇦🇪 +971 (AE)</option>
                  <option value="+972">🇮🇱 +972 (IL)</option>
                  <option value="+973">🇧🇭 +973 (BH)</option>
                  <option value="+974">🇶🇦 +974 (QA)</option>
                  <option value="+975">🇧🇹 +975 (BT)</option>
                  <option value="+976">🇲🇳 +976 (MN)</option>
                  <option value="+977">🇳🇵 +977 (NP)</option>
                  <option value="+992">🇹🇯 +992 (TJ)</option>
                  <option value="+993">🇹🇲 +993 (TM)</option>
                  <option value="+994">🇦🇿 +994 (AZ)</option>
                  <option value="+995">🇬🇪 +995 (GE)</option>
                  <option value="+996">🇰🇬 +996 (KG)</option>
                  <option value="+998">🇺🇿 +998 (UZ)</option>
                </select>
                <div className="relative flex-1">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground placeholder:text-muted-foreground"
                    placeholder="Enter phone number"
                  />
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="address" className="block text-sm font-medium text-foreground mb-2">
                Address
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  id="address"
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground placeholder:text-muted-foreground"
                  placeholder="123 Main St"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-1">
                <label htmlFor="city" className="block text-sm font-medium text-foreground mb-2">
                  City
                </label>
                <input
                  id="city"
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground placeholder:text-muted-foreground"
                  placeholder="Boston"
                />
              </div>

              <div className="col-span-1">
                <label htmlFor="state" className="block text-sm font-medium text-foreground mb-2">
                  State
                </label>
                <input
                  id="state"
                  type="text"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground placeholder:text-muted-foreground"
                  placeholder="MA"
                />
              </div>

              <div className="col-span-1">
                <label htmlFor="zipCode" className="block text-sm font-medium text-foreground mb-2">
                  ZIP
                </label>
                <input
                  id="zipCode"
                  type="text"
                  value={zipCode}
                  onChange={(e) => setZipCode(e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground placeholder:text-muted-foreground"
                  placeholder="02108"
                />
              </div>
            </div>

            <div>
              <label htmlFor="country" className="block text-sm font-medium text-foreground mb-2">
                Country
              </label>
              <select
                id="country"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground"
              >
                <option value="United States">United States</option>
                <option value="United Kingdom">United Kingdom</option>
                <option value="Canada">Canada</option>
                <option value="Australia">Australia</option>
                <option value="India">India</option>
                <option value="Germany">Germany</option>
                <option value="France">France</option>
                <option value="Italy">Italy</option>
                <option value="Spain">Spain</option>
                <option value="Japan">Japan</option>
                <option value="China">China</option>
                <option value="Brazil">Brazil</option>
                <option value="Mexico">Mexico</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </motion.div>
        );

      case 'medical':
        return (
          <motion.div
            key="medical"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            <div>
              <label htmlFor="diagnosis" className="block text-sm font-medium text-foreground mb-2">
                Primary Diagnosis
              </label>
              <input
                id="diagnosis"
                type="text"
                value={diagnosis}
                onChange={(e) => setDiagnosis(e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground placeholder:text-muted-foreground"
                placeholder="e.g., Breast Cancer"
              />
            </div>

            <div>
              <label htmlFor="stage" className="block text-sm font-medium text-foreground mb-2">
                Stage (if applicable)
              </label>
              <input
                id="stage"
                type="text"
                value={stage}
                onChange={(e) => setStage(e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground placeholder:text-muted-foreground"
                placeholder="e.g., Stage II"
              />
            </div>

            <div>
              <label htmlFor="currentTreatment" className="block text-sm font-medium text-foreground mb-2">
                Current Treatment
              </label>
              <textarea
                id="currentTreatment"
                value={currentTreatment}
                onChange={(e) => setCurrentTreatment(e.target.value)}
                rows={3}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground placeholder:text-muted-foreground resize-none"
                placeholder="Describe your current treatment plan..."
              />
            </div>

            <div>
              <label htmlFor="allergies" className="block text-sm font-medium text-foreground mb-2">
                Known Allergies
              </label>
              <textarea
                id="allergies"
                value={allergies}
                onChange={(e) => setAllergies(e.target.value)}
                rows={2}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground placeholder:text-muted-foreground resize-none"
                placeholder="List any known drug allergies..."
              />
            </div>
          </motion.div>
        );
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-background via-primary/5 to-background p-4">
      {/* Blurry Blob Background */}
      <div className="absolute inset-0 flex items-center justify-center">
        <BlurryBlob
          firstBlobColor="bg-primary/30"
          secondBlobColor="bg-purple-500/30"
        />
      </div>

      {/* Signup Form */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-2xl"
      >
        <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-8 shadow-2xl">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="font-serif text-4xl font-bold text-foreground mb-2">
              Create Account
            </h1>
            <p className="text-muted-foreground">
              {step === 'account' && 'Set up your account credentials'}
              {step === 'personal' && 'Tell us about yourself'}
              {step === 'medical' && 'Share your medical information'}
            </p>
          </div>

          {/* Progress Bar */}
          <div className="flex items-center justify-between mb-8">
            {['account', 'personal', 'medical'].map((s, i) => (
              <React.Fragment key={s}>
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                      step === s
                        ? 'border-primary bg-primary text-primary-foreground'
                        : ['account', 'personal'].indexOf(step) > ['account', 'personal'].indexOf(s as FormStep)
                        ? 'border-primary bg-primary/20 text-primary'
                        : 'border-white/20 bg-white/5 text-muted-foreground'
                    }`}
                  >
                    {i + 1}
                  </div>
                  <span className="text-xs mt-2 text-muted-foreground capitalize">{s}</span>
                </div>
                {i < 2 && (
                  <div
                    className={`flex-1 h-0.5 -mt-6 transition-all ${
                      ['account', 'personal'].indexOf(step) > i
                        ? 'bg-primary'
                        : 'bg-white/20'
                    }`}
                  />
                )}
              </React.Fragment>
            ))}
          </div>

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg text-sm mb-6"
            >
              {error}
            </motion.div>
          )}

          {/* Form Steps */}
          <AnimatePresence mode="wait">
            {renderStep()}
          </AnimatePresence>

          {/* Navigation Buttons */}
          <div className="flex gap-4 mt-8">
            {step !== 'account' && (
              <Button
                type="button"
                onClick={prevStep}
                className="flex-1 bg-white/5 hover:bg-white/10 text-foreground border border-white/10"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Back
              </Button>
            )}
            {step !== 'medical' ? (
              <Button
                type="button"
                onClick={nextStep}
                className={`${step === 'account' ? 'w-full' : 'flex-1'} bg-primary hover:bg-primary/90 text-primary-foreground`}
              >
                Next
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleSignup}
                disabled={loading}
                className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    Creating Account...
                  </span>
                ) : (
                  'Complete Signup'
                )}
              </Button>
            )}
          </div>

          {/* Login Link */}
          <div className="mt-8 text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link
              href="/auth/login"
              className="text-primary hover:text-primary/80 transition-colors font-semibold"
            >
              Sign in
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

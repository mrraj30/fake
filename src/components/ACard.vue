<script setup lang="ts">
import { reactive, onMounted, ref } from "vue";
import { useSvgToJpeg } from '../composables/svg-to-jpeg';
import { parseSVG } from "../composables/useSVG";
import { Card } from "../classes/AdhaarCard";
const { exportSvg, isExporting } = useSvgToJpeg();
// Vite raw import
import plainSvgRaw from "../assets/plain.svg?raw";

interface IdentityForm {
    nameEn: string;
    nameHi: string;
    dob: string;
    frontIssueDate: string,
    backIssueDate: string,
    gender: string; // Added gender to interface
    uid: string;
    vid: string;
    addressEn1: string;
    addressEn2: string;
    addressEn3: string;
    addressHi1: string;
    addressHi2: string;
    addressHi3: string;
}

const form: IdentityForm = reactive({
    nameEn: "",
    nameHi: "",
    dob: "",
    frontIssueDate: "",
    backIssueDate: "",
    gender: "male",
    uid: "",
    vid: "",
    addressEn1: "",
    addressEn2: "",
    addressEn3: "",
    addressHi1: "",
    addressHi2: "",
    addressHi3: "",
});

const isOldVersion = ref(true);
let card: Card | null = null;

onMounted(() => {
    const container = document.getElementById("container");
    if (!container) return;

    try {
        const svgElement = parseSVG(plainSvgRaw);
        card = new Card(svgElement);
        card.dimensions(false); // Remove fixed dimensions for responsive preview

        container.innerHTML = "";
        container.appendChild(card.element);
        syncCard();
    } catch (e) {
        console.error("Initialization failed:", e);
    }
});

const syncCard = () => {
    if (!card) return;
    card.updateName(form.nameHi, form.nameEn);
    card.updateDOB(form.dob);
    card.updateFrontDate(form.frontIssueDate);
    card.updateBackDate(form.backIssueDate);
    card.updateNumber(form.uid);
    if (form.vid) {
        console.log("Yes");
    }
    else {
        card.toggleVersion()
    }
    card.updateVirtualNumber(form.vid);
    const genderLabels: Record<string, string> = {
        male: "पुरूष",
        female: "महिला",
    };
    card.updateGender(genderLabels[form.gender], form.gender);
    card.updateAddress(
        [form.addressHi1, form.addressHi2, form.addressHi3],
        [form.addressEn1, form.addressEn2, form.addressEn3],
    );
    card.updateQRCode()
};

const handleLiveFile = (e: Event, type: "photo" | "qr") => {
    const target = e.target as HTMLInputElement;
    if (target.files && target.files[0]) {
        const reader = new FileReader();
        reader.onload = (event) => {
            const base64 = event.target?.result as string;
            if (type === "photo") card?.updatePhoto(base64);
            else card?.updateQRCode(base64);
        };
        reader.readAsDataURL(target.files[0]);
    }
};

const toggleVersion = () => {
    isOldVersion.value = !isOldVersion.value;
    card?.toggleVersion(isOldVersion.value);
};

// Fix for 'window' context error: handle print in script
const handlePrint = () => {
    window.print();
};
</script>
<template>
    <div
        class="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 md:p-10 transition-colors font-sans text-slate-900 dark:text-white">
        <div class="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10">
            <!-- 1. Form Section (Hidden on Print) -->
            <section
                class="bg-white dark:bg-slate-900 rounded-3xl shadow-xl p-6 md:p-8 border border-slate-200 dark:border-slate-800 order-2 lg:order-1 print:hidden">
                <header class="mb-8 border-b dark:border-slate-800 pb-4 flex justify-between items-center">
                    <div>
                        <h1 class="text-2xl font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-tight">
                            Identity Portal
                        </h1>
                        <p class="text-slate-500 text-xs font-medium uppercase tracking-widest leading-none mt-1">
                            Live Management
                        </p>
                    </div>
                    <button @click="toggleVersion" type="button"
                        class="px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-full text-[10px] font-bold uppercase hover:bg-indigo-50 dark:hover:bg-slate-700 transition">
                        Version: {{ isOldVersion ? "Old" : "New" }}
                    </button>
                </header>

                <form @submit.prevent="handlePrint" class="space-y-8">
                    <!-- Personal Info -->
                    <fieldset
                        class="group border-2 border-slate-100 dark:border-slate-800 rounded-2xl p-5 md:p-6 transition-all duration-300 hover:border-indigo-100 dark:hover:border-indigo-900/30">
                        <legend
                            class="px-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                            Personal Profile / व्यक्तिगत विवरण
                        </legend>

                        <div class="grid grid-cols-1 md:grid-cols-2 gap-5 mt-2">
                            <!-- English Name -->
                            <div class="space-y-1.5">
                                <label class="text-xs md:text-l font-bold text-slate-400 uppercase ml-1">Full Name
                                    (English)</label>
                                <input v-model="form.nameEn" @input="syncCard" placeholder="Mohan Kumar" required
                                    class="w-full p-3.5 bg-slate-50/50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl dark:text-white outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all text-sm" />
                            </div>

                            <!-- Hindi Name -->
                            <div class="space-y-1.5">
                                <label class="text-xs md:text-l font-bold text-slate-400 uppercase ml-1 block">पूरा
                                    नाम (हिंदी)</label>
                                <input v-model="form.nameHi" @input="syncCard" placeholder="मोहन कुमार" required
                                    class="w-full p-3.5 bg-slate-50/50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl dark:text-white outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all text-sm" />
                            </div>

                            <!-- Date of Birth -->
                            <div class="space-y-1.5">
                                <label class="text-xs md:text-l font-bold text-slate-400 uppercase ml-1">Date of
                                    Birth</label>
                                <input v-model="form.dob" @change="syncCard" type="date" required
                                    class="w-full p-3.5 bg-slate-50/50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl dark:text-white outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all text-sm" />
                            </div>

                            <!-- Gender Selection -->
                            <div class="space-y-1.5">
                                <label class="text-xs md:text-l font-bold text-slate-400 uppercase ml-1">Gender /
                                    लिंग</label>
                                <select v-model="form.gender" @change="syncCard" required
                                    class="w-full p-3.5 bg-slate-50/50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl dark:text-white outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all text-sm appearance-none cursor-pointer">
                                    <option value="male">MALE / पुरूष</option>
                                    <option value="female">FEMALE / महिला</option>
                                </select>
                            </div>
                        </div>
                    </fieldset>

                    <!-- Identification -->
                    <fieldset
                        class="group border-2 border-slate-100 dark:border-slate-800 rounded-2xl p-5 md:p-6 transition-all duration-300 hover:border-indigo-100 dark:hover:border-indigo-900/30">
                        <!-- Modern Floating Legend -->
                        <legend
                            class="px-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                            Identification / पहचान
                        </legend>

                        <div class="space-y-5 mt-2">
                            <!-- UID & VID Inputs -->
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div class="space-y-1.5">
                                    <label
                                        class="text-xs md:text-l font-bold text-slate-400 uppercase ml-1 tracking-wider">Addhar
                                        Card Number ( 12-Digit )</label>
                                    <input v-model="form.uid" @input="syncCard" maxlength="12" required minlength="12"
                                        placeholder="0000 0000 0000"
                                        class="w-full p-3.5 bg-slate-50/50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl dark:text-white outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all font-mono tracking-[0.2em] text-sm placeholder:text-slate-300">
                                </div>
                                <div class="space-y-1.5">
                                    <label
                                        class="text-xs md:text-l font-bold text-slate-400 uppercase ml-1 tracking-wider">16-Digit
                                        VID</label>
                                    <input v-model="form.vid" @input="syncCard" maxlength="16" minlength="16"
                                        placeholder="0000 0000 0000 0000"
                                        class="w-full p-3.5 bg-slate-50/50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl dark:text-white outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all font-mono tracking-widest text-sm placeholder:text-slate-300">
                                </div>
                            </div>

                            <!-- File Upload Zones -->
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
                                <!-- Photo Upload -->
                                <div
                                    class="relative group/file p-4 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50/30 dark:bg-slate-900/30 hover:bg-white dark:hover:bg-slate-800 hover:border-indigo-400 transition-all duration-200">
                                    <label class="flex flex-col items-center cursor-pointer">
                                        <span
                                            class="text-xs md:text-l font-black text-slate-400 dark:text-slate-500 uppercase mb-2 tracking-widest group-hover/file:text-indigo-500">Photo
                                            / फोटो</span>
                                        <input type="file" accept="image/*" @change="(e) => handleLiveFile(e, 'photo')"
                                            class="block w-full text-[10px] text-slate-400 file:mr-4 file:py-1.5 file:px-4 file:rounded-full file:border-0 file:text-[10px] file:font-bold file:bg-indigo-50 dark:file:bg-indigo-950 file:text-indigo-600 dark:file:text-indigo-400 hover:file:bg-indigo-100">
                                    </label>
                                </div>

                                <!-- QR Code Upload -->
                                <div
                                    class="relative group/file p-4 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50/30 dark:bg-slate-900/30 hover:bg-white dark:hover:bg-slate-800 hover:border-indigo-400 transition-all duration-200">
                                    <label class="flex flex-col items-center cursor-pointer">
                                        <span
                                            class="text-xs md:text-l font-black text-slate-400 dark:text-slate-500 uppercase mb-2 tracking-widest group-hover/file:text-indigo-500">QR
                                            Code / क्यूआर</span>
                                        <input type="file" accept="image/*" @change="(e) => handleLiveFile(e, 'qr')"
                                            
                                            class="block w-full text-[10px] text-slate-400 file:mr-4 file:py-1.5 file:px-4 file:rounded-full file:border-0 file:text-[10px] file:font-bold file:bg-indigo-50 dark:file:bg-indigo-950 file:text-indigo-600 dark:file:text-indigo-400 hover:file:bg-indigo-100">
                                    </label>
                                </div>
                            </div>
                        </div>
                    </fieldset>

                    <!--  Card Date  -->
                    <fieldset
                        class="group border-2 border-slate-100 dark:border-slate-800 rounded-2xl p-5 md:p-6 transition-all duration-300 hover:border-indigo-100 dark:hover:border-indigo-900/30">
                        <legend
                            class="px-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                            Personal Profile / व्यक्तिगत विवरण
                        </legend>

                        <div class="grid grid-cols-1 md:grid-cols-2 gap-5 mt-2">
                            <!-- Front Issue Date -->
                            <div class="space-y-1.5">
                                <label class="text-xs md:text-l font-bold text-slate-400 uppercase ml-1">Front Issue
                                    Date</label>
                                <input v-model="form.frontIssueDate" @change="syncCard" type="date"
                                    class="w-full p-3.5 bg-slate-50/50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl dark:text-white outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all text-sm" />
                            </div>

                            <!-- Back Issue Date -->
                            <div class="space-y-1.5">
                                <label class="text-xs md:text-l font-bold text-slate-400 uppercase ml-1">Back Issue
                                    Date</label>
                                <input v-model="form.backIssueDate" @change="syncCard" type="date"
                                    class="w-full p-3.5 bg-slate-50/50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl dark:text-white outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all text-sm" />
                            </div>
                        </div>
                    </fieldset>

                    <!-- Address -->
                    <fieldset
                        class="group border-2 border-slate-100 dark:border-slate-800 rounded-2xl p-5 md:p-6 transition-all duration-300 hover:border-indigo-100 dark:hover:border-indigo-900/30">
                        <!-- Modern Floating Legend -->
                        <legend
                            class="px-4 text-xs md:text-l font-black uppercase tracking-[0.2em] text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                            Address / पता
                        </legend>

                        <div class="space-y-5 mt-2">
                            <!-- Address English -->
                            <div class="space-y-1.5">
                                <label
                                    class="text-xs md:text-l font-bold text-slate-400 dark:text-slate-500 uppercase ml-1 tracking-wider">Permanent
                                    Address (English)</label>
                                <input v-model="form.addressEn1" @input="syncCard" type="text" required
                                    placeholder="Address Line 1"
                                    class="w-full p-3.5 bg-slate-50/50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl dark:text-white outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all font-mono tracking-widest text-sm placeholder:text-slate-300">
                                <input v-model="form.addressEn2" @input="syncCard" type="text" required
                                    placeholder="Address Line 2"
                                    class="w-full p-3.5 bg-slate-50/50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl dark:text-white outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all font-mono tracking-widest text-sm placeholder:text-slate-300">
                                <input v-model="form.addressEn3" @input="syncCard" type="text"
                                    placeholder="Address Line 3"
                                    class="w-full p-3.5 bg-slate-50/50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl dark:text-white outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all font-mono tracking-widest text-sm placeholder:text-slate-300">
                            </div>

                            <!-- Address Hindi -->
                            <div class="space-y-1.5">
                                <label
                                    class="text-xs md:text-l font-bold text-slate-400 dark:text-slate-500 uppercase ml-1 tracking-wider block">स्थायी
                                    पता (हिंदी)</label>
                                <input v-model="form.addressHi1" @input="syncCard" type="text" required
                                    placeholder="स्थायी पता 1"
                                    class="w-full p-3.5 bg-slate-50/50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl dark:text-white outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all font-mono tracking-widest text-sm placeholder:text-slate-300">
                                <input v-model="form.addressHi2" @input="syncCard" type="text" required
                                    placeholder="स्थायी पता 2"
                                    class="w-full p-3.5 bg-slate-50/50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl dark:text-white outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all font-mono tracking-widest text-sm placeholder:text-slate-300">
                                <input v-model="form.addressHi3" @input="syncCard" type="text"
                                    placeholder="स्थायी पता 3"
                                    class="w-full p-3.5 bg-slate-50/50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl dark:text-white outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all font-mono tracking-widest text-sm placeholder:text-slate-300">

                            </div>
                        </div>
                    </fieldset>

                    <button type="submit"
                        class="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl shadow-xl transition active:scale-95 uppercase tracking-widest cursor-pointer">
                        Print Identity Card
                    </button>
                </form>
            </section>


            <!-- 2. Preview Section -->
            <section
                class="order-1 lg:order-2 flex flex-col items-center justify-start lg:sticky lg:top-10 h-fit print:static print:p-0">

                <!-- Native details starts open by default -->
                <details open class="group w-full max-w-full select-none">

                    <!-- Modernized Summary -->
                    <summary class="flex cursor-pointer items-center justify-between px-1 mb-6 list-none print:hidden">
                        <div class="flex items-center gap-2">
                            <h2
                                class="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.4em]">
                                Live SVG Rendering
                            </h2>
                            <button :disabled="isExporting" @click="exportSvg('container', 'a4', 0.9, 100, 'middle')"
                                class="relative inline-flex items-center justify-center px-6 py-3 font-semibold text-white transition-all duration-200 bg-blue-600 rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-70 disabled:cursor-not-allowed">
                                <!-- Loading Spinner -->
                                <svg v-if="isExporting" class="w-5 h-5 mr-3 animate-spin text-white"
                                    xmlns="http://www.w3.org" fill="none" viewBox="0 0 24 24">
                                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor"
                                        stroke-width="4"></circle>
                                    <path class="opacity-75" fill="currentColor"
                                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
                                    </path>
                                </svg>

                                <span>
                                    {{ isExporting ? 'Generating A4 JPEG...' : 'Export to A4' }}
                                </span>
                            </button>
                        </div>


                        <!-- Icon rotates automatically when <details> is open -->
                        <svg class="w-4 h-4 text-slate-300 transition-transform duration-300 group-open:rotate-180"
                            fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
                        </svg>
                    </summary>

                    <!-- Main Rendering Card -->
                    <div id="container"
                        class="relative w-full aspect-[1.58/1] bg-white rounded-4xl shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] border border-slate-100 dark:border-slate-800/50 flex items-center justify-center overflow-hidden transition-all duration-500 hover:shadow-[0_40px_80px_-16px_rgba(0,0,0,0.15)] print:shadow-none print:border-none print:m-0">

                        <!-- Modern Minimal Loader -->
                        <div class="flex flex-col items-center gap-3 animate-pulse print:hidden">
                            <div class="w-1.5 h-1.5 bg-indigo-500 rounded-full shadow-[0_0_12px_rgba(99,102,241,0.8)]">
                            </div>
                            <p class="text-[10px] font-bold text-slate-400 tracking-[0.2em] uppercase opacity-60">
                                Updating
                            </p>
                        </div>

                    </div>
                </details>

            </section>

        </div>
    </div>
</template>



<style scoped>
@reference "../style.css";


#container :deep(svg) {
    width: 100%;
    height: 100%;
    display: block;
}

@media print {
    body {
        background: white !important;
    }

    #container {
        width: 100% !important;
        max-width: none !important;
    }

    #container svg {
        width: 100% !important;
        height: auto !important;
    }
}

summary::-webkit-details-marker {
    display: none;
}

summary {
    display: flex;
}
</style>

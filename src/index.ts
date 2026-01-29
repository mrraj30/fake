import * as QRCode from 'qrcode';
const parser = new DOMParser();

export const loadSVG = async (path: string): Promise<SVGSVGElement> => {
    const response = await fetch(path);
    if (!response.ok) throw new Error(`Failed to load SVG: ${response.statusText}`);
    const data = await response.text();
    const svgDoc = parser.parseFromString(data, "image/svg+xml");
    return svgDoc.documentElement as unknown as SVGSVGElement;
};
interface CardInformation {
    name_hi?: string;
    name_en?: string;
    number?: string;
    virtualNumber?: string;
    gender?: string;
    address_hi?: string[];
    address_en?: string[];
    dob?: string;
}
async function generateQR(text: string) {
    try {

        const dataUrl = await QRCode.toDataURL(text, {errorCorrectionLevel: 'H'});
        return dataUrl
    } catch (err) {
        console.error(err);
    }
}
class Card {
    readonly #svg: SVGElement;
    readonly #originalDims: { w: string | null; h: string | null };
    #cache = new Map<string, Element>();
    private cardInformation: CardInformation = {}

    constructor(template: SVGElement) {
        this.#svg = template.cloneNode(true) as SVGElement;
        this.#originalDims = {
            w: this.#svg.getAttribute("width"),
            h: this.#svg.getAttribute("height")
        };
    }

    /** Optimized selector that caches results */
    private getEl<T extends Element>(selector: string): T | null {
        if (!this.#cache.has(selector)) {
            const el = this.#svg.querySelector(selector);
            if (el) this.#cache.set(selector, el);
        }
        return (this.#cache.get(selector) as T) || null;
    }

    private setText(selector: string, value: string) {
        const el = this.getEl(selector);
        if (el) {
            el.textContent = value;
        } else {
            console.error({ id: selector, el: el, value: value });
        }

    }

    private setTspan(selector: string, value: string) {
        const el = this.getEl(selector)?.childNodes;
        el?.forEach((tspan) => {
            tspan.textContent = value
        })
    }

    private setHref(selector: string, blob: string) {
        const el = this.getEl(selector);
        if (el) el.setAttribute("xlink:href", blob);
    }

    private formatDate(iso: string): string {
        const d = new Date(iso);
        if (isNaN(d.getTime())) return "dd/mm/yyyy";
        return d.toLocaleDateString('en-GB'); // Returns DD/MM/YYYY
    }

    updateNumber(num: string = "123456789012") {
        if (num.length !== 12) return;
        ["#tspan33", "#tspan34", "#tspan35"].forEach((id, i) => {
            this.setText(id, num.substring(i * 4, (i + 1) * 4));
        });
        this.cardInformation.number = num;
    }

    updateVirtualNumber(num = "1234567890123456") {
        const chunks = num.match(/.{1,4}/g) || [];
        ["#tspan35-4", "#tspan37", "#tspan39", "#tspan41"].forEach((id, i) => {
            this.setText(id, chunks[i] || "");
        });
        this.cardInformation.virtualNumber = num;
    }

    updateGender(hi = "पुरूष", en = "MALE") {
        const gender = this.getEl("#gender");
        const sub = gender?.childNodes[0]?.cloneNode(true);
        this.setText("#gender", hi);
        if (sub && gender) {
            sub.textContent = `/ ${en.toUpperCase()}`;
            gender.appendChild(sub);
        }
        this.cardInformation.virtualNumber = hi;
    }

    updateAddress(hi: string[] = [], en: string[] = []) {
        const enIds_child = this.getEl("#address__en")?.childNodes;
        enIds_child?.forEach((tspan, i) => {
            if (tspan.nodeName === "tspan") {
                tspan.textContent = en[i] || ""
            }
        })
        this.cardInformation.address_hi = hi;
        const hiIds_child = this.getEl("#address__hi")?.childNodes;
        hiIds_child?.forEach((tspan, i) => {
            if (tspan.nodeName === "tspan") {
                tspan.textContent = hi[i] || ""
            }
        })
        this.cardInformation.address_en = en;
    }
    setHide(selector: string, ishide: boolean = true) {
        const el = this.getEl<SVGElement>(selector);
        if (el) el.style.display = ishide ? "none" : "inline"
    }
    toggleVersion(isOld = true) {
        const oldV = this.getEl<SVGElement>("#g44");
        const newV = this.getEl<SVGElement>("#g45");
        if (oldV) oldV.style.display = isOld ? "inline" : "none";
        if (newV) newV.style.display = isOld ? "none" : "inline";
    }

    updatePhoto(base: string) { this.setHref("#card_photo", base); }
    async updateQRCode(base?: string) {
        if (base) {
            this.setHref("#image2033", base);
        } else {
            try {
                const qr_code_value = await generateQR(JSON.stringify(this.cardInformation));
                if (qr_code_value) {
                    this.setHref("#image2033", qr_code_value)
                }

            } catch (error) {

            }

        }

    }
    updateName(hi = "मोहन कुमार", en = "Mohan Kumar") {
        this.setTspan("#name__hi", hi);
        this.setTspan("#name__en", en);
        this.cardInformation.name_hi = hi;
        this.cardInformation.name_en = en;
    }
    updateDOB(d: string) {
        this.setTspan("#dob", this.formatDate(d));
        this.cardInformation.dob = d;
    }
    updateFrontDate(d: string) {
        if (d) {
            this.setText("#tspan47", this.formatDate(d));
        } else {
            this.setHide("#front_issue_date");
        }

    }
    updateBackDate(d: string) {
        if (d) {
            this.setText("#tspan46", this.formatDate(d));
        } else {
            this.setHide("#back_issue_date");
        }

    }

    dimensions(visible: boolean) {
        if (visible && this.#originalDims.w) {
            this.#svg.setAttribute("width", this.#originalDims.w);
            this.#svg.setAttribute("height", this.#originalDims.h!);
        } else {
            this.#svg.removeAttribute("width");
            this.#svg.removeAttribute("height");
        }
    }

    get element() { return this.#svg; }
}


/**
 * Modern Identity Card Controller
 * Integrates SVG manipulation and Form Handling
 */
class CardGenerator {
    private form: HTMLFormElement;
    private photoInput: HTMLInputElement;
    private qr_code: HTMLInputElement;
    private container: HTMLElement;
    private card: Card | null = null;
    private _qr_code_use: boolean = false;


    constructor() {
        this.form = document.getElementById("userCard") as HTMLFormElement;
        this.photoInput = document.getElementById("photo") as HTMLInputElement;
        this.qr_code = document.getElementById("qr_code") as HTMLInputElement;
        this.container = document.getElementById("load_svg") as HTMLElement;

        // Kick off async initialization
        this.setup();
    }

    private async setup(): Promise<void> {
        try {
            // Load SVG Template
            const svgTemplate = await loadSVG("/fake/assets/plain.svg");
            this.card = new Card(svgTemplate);

            // Clear container and inject SVG
            this.container.innerHTML = "";
            this.container.appendChild(this.card.element);

            // Initialize Event Listeners only after card is ready
            this.attachEventListeners();
            console.log("SVG Card initialized successfully.");
        } catch (error) {
            console.error("Critical Failure: Could not load SVG template", error);
        }
    }

    private attachEventListeners(): void {
        // Sync text inputs
        this.form.querySelectorAll("input, select").forEach((element) => {
            element.addEventListener("input", () => this.syncPreview());
        });

        // Sync photo (updated for SVG image injection if needed)
        this.photoInput.addEventListener("change", (e) =>
            this.handleImageUpload("photo", e),
        );
        this.qr_code.addEventListener("change", (e) =>
            this.handleImageUpload("qr_code", e),
        );

        // Handle Print
        this.form.addEventListener("submit", (e) => {
            e.preventDefault();
            this.card?.dimensions(true);
            window.print();
        });
    }

    private handleImageUpload(type: "qr_code" | "photo", event: Event): void {
        const input = event.target as HTMLInputElement;
        if (input.files && input.files[0]) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const base64 = e.target?.result as string;
                switch (type) {
                    case "qr_code":
                        this.card?.updateQRCode(base64);
                        this._qr_code_use = true;
                        break;

                    default:
                        this.card?.updatePhoto(base64);
                        break;
                }
            };
            reader.readAsDataURL(input.files[0]);
        }
    }

    private syncPreview(): void {
        if (!this.card) return;
        this.card.dimensions(false);

        const getVal = (id: string) =>
            (document.getElementById(id) as HTMLInputElement).value;

        // 1. Update Name
        this.card.updateName(getVal("name_hi"), getVal("name_en"));

        // 2. Update IDs
        this.card.updateNumber(getVal("number"));
        const virtualnumber = getVal("virtualnumber");
        if (virtualnumber.length === 16) {
            this.card.updateVirtualNumber(getVal("virtualnumber"));
            this.card.toggleVersion(false);
        } else {
            this.card.toggleVersion()
        }

        // 3. Update DOB & Gender
        this.card.updateDOB(getVal("dob"));
        this.card.updateBackDate(getVal("back_date"));
        this.card.updateFrontDate(getVal("front_date"));
        this.card.updateGender(
            getVal("gender") === "male" ? "पुरूष" : "महिला",
            getVal("gender"),
        );

        // 4. Update Address (Mapping form inputs to arrays)
        const addrHi = [
            getVal("address_hi_1"),
            getVal("address_hi_2"),
            getVal("address_hi_3"),
        ];
        const addrEn = [
            getVal("address_en_1"),
            getVal("address_en_2"),
            getVal("address_en_3"),
        ];
        if (!this._qr_code_use) {
            this.card.updateQRCode();
        }
        this.card.updateAddress(addrHi, addrEn);
    }
}

// Ensure the DOM is ready
document.addEventListener("DOMContentLoaded", () => new CardGenerator());


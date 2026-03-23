import * as QRCode from 'qrcode';

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

        const dataUrl = await QRCode.toDataURL(text, { errorCorrectionLevel: 'H' });
        return dataUrl
    } catch (err) {
        console.error(err);
    }
}
export class Card {
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
            return el;
        } else {
            console.error({ id: selector, el: el, value: value });
            return null
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
        this.cardInformation.gender = hi;
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
    hide(selector: string) {
        this.setHide(selector, true)
    }
    show(selector: string) {
        this.setHide(selector, false)
    }
    toggleVersion(isOld = true) {
        const oldV = this.getEl<SVGElement>("#old_version_group");
        const newV = this.getEl<SVGElement>("#new_version_group");
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
        this.cardInformation.dob = this.formatDate(d);
    }
    updateFrontDate(d: string) {
        if (d) {
            this.setText("#tspan47", this.formatDate(d));
            this.show("#front_issue_date")
        } else {
            this.hide("#front_issue_date");
        }

    }
    updateBackDate(d: string) {
        if (d) {
            this.setText("#tspan46", this.formatDate(d));
            this.show("#back_issue_date")
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
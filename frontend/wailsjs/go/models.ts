export namespace domain {
	
	export class Brand {
	    id: number;
	    name: string;
	    description: string;
	
	    static createFrom(source: any = {}) {
	        return new Brand(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.name = source["name"];
	        this.description = source["description"];
	    }
	}
	export class Category {
	    id: number;
	    name: string;
	    description: string;
	
	    static createFrom(source: any = {}) {
	        return new Category(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.name = source["name"];
	        this.description = source["description"];
	    }
	}
	export class ItemVariant {
	    id: number;
	    productId: number;
	    sku: string;
	    sizing: string;
	    currentStock: number;
	    minStock: number;
	    unit: string;
	    // Go type: time
	    expirationDate?: any;
	    primarySupplier: string;
	    price: number;
	    costPrice: number;
	    vatRate: number;
	
	    static createFrom(source: any = {}) {
	        return new ItemVariant(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.productId = source["productId"];
	        this.sku = source["sku"];
	        this.sizing = source["sizing"];
	        this.currentStock = source["currentStock"];
	        this.minStock = source["minStock"];
	        this.unit = source["unit"];
	        this.expirationDate = this.convertValues(source["expirationDate"], null);
	        this.primarySupplier = source["primarySupplier"];
	        this.price = source["price"];
	        this.costPrice = source["costPrice"];
	        this.vatRate = source["vatRate"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class Product {
	    id: number;
	    name: string;
	    description: string;
	    imagePath: string;
	    categoryId?: number;
	    brandId?: number;
	    brand?: Brand;
	    category?: Category;
	    variants: ItemVariant[];
	
	    static createFrom(source: any = {}) {
	        return new Product(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.name = source["name"];
	        this.description = source["description"];
	        this.imagePath = source["imagePath"];
	        this.categoryId = source["categoryId"];
	        this.brandId = source["brandId"];
	        this.brand = this.convertValues(source["brand"], Brand);
	        this.category = this.convertValues(source["category"], Category);
	        this.variants = this.convertValues(source["variants"], ItemVariant);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class Purchase {
	    id: number;
	    variantId: number;
	    description: string;
	    quantity: number;
	    unitCost: number;
	    // Go type: time
	    createdAt: any;
	
	    static createFrom(source: any = {}) {
	        return new Purchase(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.variantId = source["variantId"];
	        this.description = source["description"];
	        this.quantity = source["quantity"];
	        this.unitCost = source["unitCost"];
	        this.createdAt = this.convertValues(source["createdAt"], null);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class ReportRow {
	    period: string;
	    revenue: number;
	    profit: number;
	
	    static createFrom(source: any = {}) {
	        return new ReportRow(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.period = source["period"];
	        this.revenue = source["revenue"];
	        this.profit = source["profit"];
	    }
	}
	export class SaleItem {
	    id: number;
	    saleId: number;
	    variantId: number;
	    description: string;
	    quantity: number;
	    unitPrice: number;
	    costPrice: number;
	    vatRate: number;
	
	    static createFrom(source: any = {}) {
	        return new SaleItem(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.saleId = source["saleId"];
	        this.variantId = source["variantId"];
	        this.description = source["description"];
	        this.quantity = source["quantity"];
	        this.unitPrice = source["unitPrice"];
	        this.costPrice = source["costPrice"];
	        this.vatRate = source["vatRate"];
	    }
	}
	export class Sale {
	    id: number;
	    subtotal: number;
	    vatAmount: number;
	    total: number;
	    // Go type: time
	    createdAt: any;
	    items: SaleItem[];
	
	    static createFrom(source: any = {}) {
	        return new Sale(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.subtotal = source["subtotal"];
	        this.vatAmount = source["vatAmount"];
	        this.total = source["total"];
	        this.createdAt = this.convertValues(source["createdAt"], null);
	        this.items = this.convertValues(source["items"], SaleItem);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}

}


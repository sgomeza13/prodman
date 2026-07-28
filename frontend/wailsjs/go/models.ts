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
	export class ItemVariant {
	    id: number;
	    productId: number;
	    sku: string;
	    sizing: string;
	    currentStock: number;
	    // Go type: time
	    expirationDate?: any;
	    primarySupplier: string;
	    price: number;
	
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
	        this.expirationDate = this.convertValues(source["expirationDate"], null);
	        this.primarySupplier = source["primarySupplier"];
	        this.price = source["price"];
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
	    categoryId?: number;
	    brandId?: number;
	    brand?: Brand;
	    variants: ItemVariant[];
	
	    static createFrom(source: any = {}) {
	        return new Product(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.name = source["name"];
	        this.description = source["description"];
	        this.categoryId = source["categoryId"];
	        this.brandId = source["brandId"];
	        this.brand = this.convertValues(source["brand"], Brand);
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

}


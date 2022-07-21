const lodash = require('lodash');

module.exports = async (orderDetails) => {
	let itemIndex = 0;
	let totalItems = [];
	let logisticsInfo = [];

	// TRANSFORMA OS COMPONENTES DO KIT EM ITENS NO PAYLOAD E CRIA O LOGISTICS_INFO PARA CADA
	for (let index = 0; index < orderDetails.items.length; index++) {
		if (orderDetails.items[index].components && orderDetails.items[index].components.length) {
			orderDetails.items[index].components.forEach(subItem => {
				totalItems.push({
					...subItem,
					quantity: orderDetails.items[index].quantity * subItem.quantity,
					additionalInfo: subItem.additionalInfo.categories ? subItem.additionalInfo : orderDetails.items[index].additionalInfo
				});

				logisticsInfo.push({
					...orderDetails.shippingData.logisticsInfo[index],
					itemIndex,
					sku_id: subItem.id,
					item_quantity: subItem.quantity,
					price: orderDetails.shippingData.logisticsInfo[index].price / orderDetails.items[index].components.length
				});

				itemIndex++;
			});
		} else {
			totalItems.push(orderDetails.items[index]);

			logisticsInfo.push({
				...orderDetails.shippingData.logisticsInfo[index],
				itemIndex,
				sku_id: orderDetails.items[index].id,
				item_quantity: orderDetails.items[index].quantity,
			});

			itemIndex++;
		}
	}

	// ORDENA OS WAREHOUSES_IDS PARA CADA ITEM
	let warehousesIds = orderDetails
		.shippingData
		.logisticsInfo[0]
		.deliveryIds[0]
		.warehouseId
		.split("#");

	const logisticsInfoOrderBySkuId = lodash.orderBy(
		logisticsInfo, ['sku_id'], ['asc']
	);

	const logisticsInfoSeparateWarehouses = logisticsInfoOrderBySkuId.map((value, index) => {
		if (value.item_quantity > 1) {
			warehousesIds.splice(index, value.item_quantity - 1);
		}

		return {
			...value,
			deliveryIds: [
				{
					...value.deliveryIds[0],
					warehouseId: warehousesIds[index]
				}
			]
		};
	});

	const logisticsInfoOrderByItemIndex = lodash.orderBy(
		logisticsInfoSeparateWarehouses, ['itemIndex'], ['asc']
	);

	return {
		...orderDetails,
		items: totalItems,
		shippingData: {
			...orderDetails.shippingData,
			logisticsInfo: logisticsInfoOrderByItemIndex
		}
	};
};

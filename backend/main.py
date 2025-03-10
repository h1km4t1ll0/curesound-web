import json
import traceback
from statistics import mean

import aiohttp_cors
import numpy as np
from aiohttp import web
from scipy.signal import find_peaks


async def get_stress_index(data: list[float]) -> float:
    first_histogram = {}
    first_histogram_2 = {}
    first_histogram_3 = {}

    for i in range(0, 1650, 50):
        first_histogram[i] = 0
        first_histogram_2[i] = []

    for each in data:
        hundreds = int((each // 100) * 100)

        if hundreds > 1650:
            continue

        tens = each % 100

        if tens < 50:
            first_histogram[hundreds] += 1
            first_histogram_2[hundreds].append(each)
        else:
            first_histogram[hundreds + 50] += 1
            first_histogram_2[hundreds + 50].append(each)

    for interval, value in first_histogram.items():
        first_histogram[interval] = (value / len(data))
        if len(first_histogram_2[interval]) > 0:
            first_histogram_3[interval] = mean(first_histogram_2[interval])

    interval = max(first_histogram, key=first_histogram.get)

    mo = first_histogram_3[interval]
    drr = max(data) - min(data)
    amo = first_histogram[interval]

    stress_index = (amo * 100) / (2 * (drr / 1000) * (mo / 1000))
    return int(stress_index)


async def handle_get_stress_index(request: web.Request):
    try:
        raw_data = await request.json()
        data = list(map(lambda x: x.get('value', 0), raw_data))

        peaks, _ = find_peaks(data, distance=150)
        times = list(np.array(data)[peaks])
        times_ = []

        for i in range(len(times) - 1):
            times_.append(abs(float(times[i + 1] - times[i])))

        return web.Response(body=json.dumps({'stressIndex': await get_stress_index(times_)}),
                            content_type='application/json')
    except Exception as e:
        print(traceback.format_exc())
        return web.Response(text=str(e), status=400)


app = web.Application()
handle_get_stress_index_route = app.router.add_post('/get-stress-index', handle_get_stress_index)

cors = aiohttp_cors.setup(app, defaults={
    "*": aiohttp_cors.ResourceOptions(
        allow_credentials=True,
        expose_headers="*",
        allow_headers="*",
        allow_methods="*",
    )
})

cors.add(handle_get_stress_index_route)

if __name__ == '__main__':
    web.run_app(app, host='0.0.0.0', port=8080)

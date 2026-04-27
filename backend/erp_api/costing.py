from django.db import connection
from rest_framework.response import Response
from rest_framework.views import APIView


def fetchall_dict(sql: str, params=None):
    with connection.cursor() as c:
        c.execute(sql, params or [])
        cols = [col[0] for col in c.description]
        return [dict(zip(cols, row)) for row in c.fetchall()]


class ProjectProfitabilityView(APIView):
    def get(self, request):
        rows = fetchall_dict(
            "SELECT * FROM erp.vw_project_job_profitability ORDER BY project_job_id DESC"
        )
        return Response(rows)


class BatchCostSummaryView(APIView):
    def get(self, request):
        rows = fetchall_dict(
            "SELECT * FROM erp.vw_batch_cost_summary ORDER BY prod_batch_key DESC"
        )
        return Response(rows)



class ProcessCostSummaryView(APIView):
    def get(self, request):
        date_from = request.query_params.get("from")
        date_to = request.query_params.get("to")

        where = ""
        params = []
        if date_from:
            where += " AND gl.posted_at >= %s"
            params.append(date_from)
        if date_to:
            where += " AND gl.posted_at <= %s"
            params.append(date_to)

        sql = f"""
        SELECT
            cc.cost_center_key,
            cc.code AS cost_center_code,
            cc.name AS cost_center_name,
            SUM(gl.debit) AS total_debit,
            SUM(gl.credit) AS total_credit,
            SUM(gl.debit - gl.credit) AS net_cost
        FROM erp.gl_line gl
        JOIN erp.dim_cost_center cc ON cc.cost_center_key = gl.cost_center_key
        WHERE cc.cost_center_type = 'PROCESS'
          {where}
        GROUP BY cc.cost_center_key, cc.code, cc.name
        ORDER BY net_cost DESC;
        """
        rows = fetchall_dict(sql, params)
        return Response(rows)
        

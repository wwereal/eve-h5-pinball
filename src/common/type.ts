/*
 * @Description: 公共类型定义
 * @Version: 1.0
 * @Author: wangmingxu@kuaishou.com
 * @Date: 2022-11-02 20:09:56
 * @LastEditors: wangmingxu@kuaishou.com
 * @LastEditTime: 2022-11-10 20:37:07
 */
export type CommonResponse<T> = {
    result: number;
    message: string;
    data: T;
};
